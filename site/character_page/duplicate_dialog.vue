<template>
    <modal id="duplicateDialog" :action="'Duplicate character' + name" :disabled="duplicating || checking" @submit.prevent="duplicate()">
        <p>This will duplicate the character, kinks, infotags, customs, subkinks and images. Guestbook
            entries, friends, groups, and bookmarks are not duplicated.</p>
        <div class="form-row mb-2">
            <form-group-inputgroup class="col-12" :errors="errors" field="name" id="characterName" label="Name">
                <input class="form-control" type="text" id="characterName" slot-scope="props" :class="props.cls"/>
                <div slot="button" class="input-group-append">
                    <button type="button" class="btn btn-secondary" @click="checkName" :disabled="newName.length < 2 || checking">
                        Check Name
                    </button>
                </div>
                <div slot="valid" class="valid-feedback">Name valid and unused.</div>
            </form-group-inputgroup>
        </div>
    </modal>
</template>

<script lang="ts">
    import {PropOptions} from 'vue';
    import CustomDialog from '../../components/custom_dialog';
    import FormGroupInputgroup from '../../components/form_group_inputgroup.vue';
    import Modal from '../../components/Modal.vue';
    import * as Utils from '../utils';
    import {methods} from './data_store';
    import {Character} from './interfaces';

    const DuplicateDialog = CustomDialog.extend({
        components: {'form-group-inputgroup': FormGroupInputgroup, modal: Modal},
        props: {
            character: {required: true} as PropOptions<Character>
        },
        data() {
            return {
                errors: {} as {[key: string]: string},
                newName: '',
                valid: false,
                checking: false,
                duplicating: false
            };
        },
        computed: {
            name(): string {
                return this.character.character.name;
            }
        },
        methods: {
            async checkName(): Promise<boolean> {
                try {
                    this.checking = true;
                    await methods.characterNameCheck(this.newName);
                    this.valid = true;
                    this.errors = {};
                    return true;
                } catch(e) {
                    this.valid = false;
                    this.errors = {};
                    if(Utils.isJSONError(e))
                        this.errors['name]'] = <string>e.response.data.error;
                    return false;
                } finally {
                    this.checking = false;
                }
            },
            async duplicate(): Promise<void> {
                try {
                    this.duplicating = true;
                    await methods.characterDuplicate(this.character.character.id, this.newName);
                    this.hide();
                } catch(e) {
                    Utils.ajaxError(e, 'Unable to duplicate character');
                    this.valid = false;
                    if(Utils.isJSONError(e))
                        this.errors['name'] = <string>e.response.data.error;
                }
                this.duplicating = false;
            }
        }
    });
    type DuplicateDialog = InstanceType<typeof DuplicateDialog>;
    export default DuplicateDialog;
</script>