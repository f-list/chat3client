<template>
    <Modal :action="'Memo for ' + name" buttonText="Save and Close" @close="onClose" @submit="save" dialog-class="modal-lg modal-dialog-centered">
        <div class="form-group" v-if="editing">
            <textarea v-model="message" maxlength="1000" class="form-control"></textarea>
        </div>
        <div v-else>
            <p>{{message}}</p>

            <p><a href="#" @click="editing=true">Edit</a></p>
        </div>
    </Modal>
</template>

<script lang="ts">
    import {PropOptions} from 'vue';
    import CustomDialog from '../../components/custom_dialog';
    import Modal from '../../components/Modal.vue';
    import {SimpleCharacter} from '../../interfaces';
    import * as Utils from '../utils';
    import {methods} from './data_store';

    export interface Memo {
        id: number
        memo: string
        character: SimpleCharacter
        created_at: number
        updated_at: number
    }

    const MemoDialog = CustomDialog.extend({
        components: {Modal},
        props: {
            character: {required: true} as PropOptions<{id: number, name: string}>,
            memo: {} as PropOptions<Memo | undefined>
        },
        data() {
            return {
                message: '',
                editing: false,
                saving: false
            };
        },
        computed: {
            name(): string {
                return this.character.name;
            }
        },
        watch: {
            memo: 'setMemo'
        },
        methods: {
            show(): void {
                CustomDialog.options.methods!.show.call(this);
                this.setMemo();
            },
            setMemo(): void {
                if(this.memo !== undefined)
                    this.message = this.memo.memo;
            },
            onClose(): void {
                this.editing = false;
            },
            async save(): Promise<void> {
                try {
                    this.saving = true;
                    const memoReply = await methods.memoUpdate(this.character.id, this.message);
                    this.$emit('memo', this.message !== '' ? memoReply : undefined);
                    this.hide();
                } catch(e) {
                    Utils.ajaxError(e, 'Unable to set memo.');
                }
                this.saving = false;
            }
        }
    });
    type MemoDialog = InstanceType<typeof MemoDialog>;
    export default MemoDialog;
</script>