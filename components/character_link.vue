<template>
    <span :class="linkClasses" v-if="character">
        <slot v-if="deleted">[Deleted] {{ name }}</slot>
        <a :href="characterUrl" class="characterLinkLink" v-else :target="target"><slot>{{ name }}</slot></a>
    </span>
</template>

<script lang="ts">
    import Vue, {PropOptions} from 'vue';
    import {SimpleCharacter} from '../interfaces';
    import * as Utils from '../site/utils';

    const CharacterLink = Vue.extend({
        props: {
            character: {required: true} as PropOptions<SimpleCharacter | string>,
            target: {default: '_blank'} as PropOptions<string>
        },
        computed: {
            deleted(): boolean {
                return typeof(this.character) === 'string' ? false : this.character.deleted;
            },
            linkClasses(): string {
                return this.deleted ? 'characterLinkDeleted' : 'characterLink';
            },
            characterUrl(): string {
                return Utils.characterURL(this.name);
            },
            name(): string {
                return typeof(this.character) === 'string' ? this.character : this.character.name;
            }
        }
    });
    type CharacterLink = InstanceType<typeof CharacterLink>;
    export default CharacterLink;
</script>