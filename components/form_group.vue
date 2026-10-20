<template>
    <div class="form-group">
        <label v-if="label && id" :for="id">{{ label }}</label>
        <slot :cls="{'is-invalid': hasErrors, 'is-valid': valid}" :invalid="hasErrors" :valid="valid"></slot>
        <small v-if="helptext" class="form-text" :id="helpId">{{ helptext }}</small>
        <div v-if="hasErrors" class="invalid-feedback">
            <ul v-if="errorList.length > 1">
                <li v-for="error in errorList">{{ error }}</li>
            </ul>
            <template v-if="errorList.length === 1"> {{ errorList[0] }}</template>
        </div>
        <slot v-if="valid" name="valid"></slot>
    </div>
</template>

<script lang="ts">
    import Vue, {PropOptions} from 'vue';

    const FormGroup = Vue.extend({
        props: {
            field: {required: true} as PropOptions<string>,
            errors: {required: true} as PropOptions<{[key: string]: ReadonlyArray<string> | undefined}>,
            label: {} as PropOptions<string | undefined>,
            id: {} as PropOptions<string | undefined>,
            valid: {default: false} as PropOptions<boolean>,
            helptext: {} as PropOptions<string | undefined>
        },
        computed: {
            hasErrors(): boolean {
                return typeof this.errors[this.field] !== 'undefined';
            },
            errorList(): ReadonlyArray<string> {
                return this.errors[this.field] || []; //tslint:disable-line:strict-boolean-expressions
            },
            helpId(): string | undefined {
                return this.id !== undefined ? `${this.id}Help` : undefined;
            }
        }
    });
    type FormGroup = InstanceType<typeof FormGroup>;
    export default FormGroup;
</script>