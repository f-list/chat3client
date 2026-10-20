<template>
    <modal id="deleteDialog" :action="'Delete character ' + name" :disabled="deleting" @submit.prevent="deleteCharacter()">
        Are you sure you want to permanently delete {{ name }}?<br/>
        Character deletion cannot be undone for any reason.
    </modal>
</template>

<script lang="ts">
    import {PropOptions} from 'vue';
    import CustomDialog from '../../components/custom_dialog';
    import Modal from '../../components/Modal.vue';
    import * as Utils from '../utils';
    import {methods} from './data_store';
    import {Character} from './interfaces';

    const DeleteDialog = CustomDialog.extend({
        components: {modal: Modal},
        props: {
            character: {required: true} as PropOptions<Character>
        },
        data() {
            return {
                deleting: false
            };
        },
        computed: {
            name(): string {
                return this.character.character.name;
            }
        },
        methods: {
            async deleteCharacter(): Promise<void> {
                try {
                    this.deleting = true;
                    await methods.characterDelete(this.character.character.id);
                    this.hide();
                    window.location.assign('/');
                } catch(e) {
                    Utils.ajaxError(e, 'Unable to delete character');
                }
                this.deleting = false;
            }
        }
    });
    type DeleteDialog = InstanceType<typeof DeleteDialog>;
    export default DeleteDialog;
</script>