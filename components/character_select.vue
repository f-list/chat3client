<template>
    <select :value="value" @change="emit">
        <option v-for="character in characters" :value="character.id">{{character.name}}</option>
        <slot></slot>
    </select>
</template>

<script lang="ts">
    import Vue, {PropOptions} from 'vue';
    import {SimpleCharacter} from '../interfaces';
    import * as Utils from '../site/utils';

    const CharacterSelect = Vue.extend({
        props: {
            value: {required: true} as PropOptions<number>
        },
        computed: {
            characters(): SimpleCharacter[] {
                return Utils.characters;
            }
        },
        methods: {
            emit(evt: Event): void {
                this.$emit('input', parseInt((<HTMLSelectElement>evt.target).value, 10));
            }
        }
    });
    type CharacterSelect = InstanceType<typeof CharacterSelect>;
    export default CharacterSelect;
</script>