const ts = require('typescript');

function getDecoratorName(decorator) {
  return ts.isCallExpression(decorator.expression)
    ? decorator.expression.expression.getText(decorator.getSourceFile())
    : decorator.expression.getText(decorator.getSourceFile());
}

function getDecoratorArgument(decorator, index) {
  return ts.isCallExpression(decorator.expression)
    ? decorator.expression.arguments[index]
    : undefined;
}

function createProperty(object, expr) {
  object.properties.push(expr);
}

function copyIfObject(object) {
  return ts.createObjectLiteral(
    object && ts.isObjectLiteralExpression(object) ? object.properties : undefined
  );
}

function transformClass(node) {
  const data = copyIfObject(getDecoratorArgument(node.decorators[0], 0));
  const computed = {};
  const watch = {};
  const hooks = {};
  const methods = ts.createObjectLiteral();
  const props = ts.createObjectLiteral();
  createProperty(data, ts.createPropertyAssignment('methods', methods));
  createProperty(data, ts.createPropertyAssignment('props', props));
  const dataObj = ts.createObjectLiteral();
  createProperty(
    data,
    ts.createMethod(
      undefined,
      undefined,
      undefined,
      'data',
      undefined,
      undefined,
      [],
      undefined,
      ts.createBlock([ts.createReturn(dataObj)])
    )
  );

  const cls = node;
  const base = cls.heritageClauses.filter(
    x => x.token === ts.SyntaxKind.ExtendsKeyword
  )[0].types[0];

  for (const member of cls.members) {
    if (!member.decorators) member.decorators = ts.createNodeArray();
    if (member.modifiers && member.modifiers.some(x => x.kind === ts.SyntaxKind.AbstractKeyword))
      continue;

    if (ts.isAccessor(member)) {
      const entry = computed[member.name.getText()] || (computed[member.name.getText()] = {});
      entry[ts.isGetAccessor(member) ? 'get' : 'set'] = member;
    } else if (ts.isPropertyDeclaration(member)) {
      const prop = member.decorators.filter(x => getDecoratorName(x) === 'Prop')[0];
      if (prop) {
        const propData = copyIfObject(getDecoratorArgument(prop, 0));
        createProperty(props, ts.createPropertyAssignment(member.name, propData));
        continue;
      }
      if (member.name.getText().startsWith('$')) continue;
      createProperty(
        dataObj,
        ts.createPropertyAssignment(member.name, member.initializer || ts.createIdentifier('undefined'))
      );
    } else if (ts.isMethodDeclaration(member)) {
      function replaceIfSuper(node) {
        if (
          (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
          node.expression.kind === ts.SyntaxKind.SuperKeyword
        ) {
          if (!ts.isCallExpression(node.parent))
            throw new Error('The super keyword is only supported in call expressions.');
          node.expression = ts.createPropertyAccess(
            ts.createPropertyAccess(base.expression, 'options'),
            'methods'
          );
          node.parent.expression = ts.createPropertyAccess(node, 'call');
          node.parent.arguments.unshift(ts.createThis());
        } else {
          ts.forEachChild(node, replaceIfSuper);
        }
      }
      ts.forEachChild(member, replaceIfSuper);
      createProperty(methods, member);

      const hookDecorators = member.decorators.filter(
        x => getDecoratorName(x) === 'Hook'
      );
      for (const hook of hookDecorators) {
        const name = getDecoratorArgument(hook, 0).text;
        const entry = hooks[name] || (hooks[name] = []);
        entry.push(
          ts.isLiteralExpression(member.name)
            ? member.name
            : ts.isIdentifier(member.name)
              ? ts.createLiteral(member.name)
              : member.name.expression
        );
      }

      const watches = member.decorators.filter(
        x => getDecoratorName(x) === 'Watch'
      );
      for (const watchDecorator of watches) {
        const watchData = copyIfObject(getDecoratorArgument(watchDecorator, 1));
        createProperty(
          watchData,
          ts.createPropertyAssignment(
            ts.createIdentifier('handler'),
            ts.createStringLiteral(member.name.getText())
          )
        );
        const name = getDecoratorArgument(watchDecorator, 0).text;
        const entry = watch[name] || (watch[name] = []);
        entry.push(watchData);
      }

      member.decorators = undefined;
    }
  }

  function createIfAny(entries, name, iterator) {
    const keys = Object.keys(entries);
    if (!keys.length) return;
    createProperty(
      data,
      ts.createPropertyAssignment(
        name,
        ts.createObjectLiteral(
          keys.map(x => ts.createPropertyAssignment(ts.createStringLiteral(x), iterator(x, entries[x])))
        )
      )
    );
  }

  createIfAny(computed, 'computed', (key, value) => {
    if (!value.get) throw new Error(`No getter defined for ${key}`);
    const prop = ts.createObjectLiteral([
      ts.createMethod(undefined, undefined, undefined, 'get', undefined, undefined, [], undefined, value.get.body)
    ]);
    if (value.set)
      createProperty(
        prop,
        ts.createMethod(
          undefined,
          undefined,
          undefined,
          'set',
          undefined,
          undefined,
          value.set.parameters,
          undefined,
          value.set.body
        )
      );
    return prop;
  });
  createIfAny(watch, 'watch', (_, value) => ts.createArrayLiteral(value));

  for (const hook in hooks) {
    const block = hooks[hook].map(x =>
      ts.createExpressionStatement(
        ts.createCall(
          ts.createPropertyAccess(ts.createElementAccess(ts.createThis(), x), 'apply'),
          undefined,
          [ts.createThis(), ts.createIdentifier('arguments')]
        )
      )
    );
    createProperty(data, ts.createMethod(undefined, undefined, undefined, hook, undefined, undefined, [], undefined, ts.createBlock(block)));
  }

  const declaration = ts.createVariableDeclaration(
    cls.name,
    undefined,
    ts.createCall(
      ts.createPropertyAccess(base.expression, ts.createIdentifier('extend')),
      undefined,
      [data]
    )
  );
  return [
    ts.createVariableStatement(
      undefined,
      ts.createVariableDeclarationList([declaration], ts.NodeFlags.Const)
    ),
    ts.createExportDefault(cls.name)
  ];
}

module.exports = function vueTsTransformer(context) {
  const visit = node => {
    if (ts.isClassDeclaration(node) && node.decorators) {
      const decorator = node.decorators.filter(x => getDecoratorName(x) === 'Component')[0];
      if (decorator) {
        return transformClass(node);
      }
    }
    return ts.visitEachChild(node, visit, context);
  };

  return sourceFile => {
    const statements = [];
    for (const statement of sourceFile.statements) {
      const transformed = visit(statement);
      if (Array.isArray(transformed)) statements.push(...transformed);
      else statements.push(transformed);
    }
    return ts.updateSourceFileNode(sourceFile, statements);
  };
};
