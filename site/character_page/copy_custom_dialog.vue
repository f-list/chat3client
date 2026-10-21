<template>
    <modal id="copyCustomDialog" action="Copy Custom Kink" :disabled="!valid || submitting" @submit.prevent="copyCustom()">
        <form-group field="name" :errors="formErrors" label="Name" id="copyCustomName">
            <template v-slot="props">
                <input type="text" class="form-control" maxlength="30" required v-model="name" id="copyCustomName" :class="props.cls"/>
            </template>
        </form-group>
        <form-group field="description" :errors="formErrors" label="Description" id="copyCustomDescription">
            <template v-slot="props">
                <input type="text" class="form-control" max-length="250" v-model="description" required id="copyCustomDescription" :class="props.cls"/>
            </template>
        </form-group>
        <form-group field="choice" :errors="formErrors" label="Choice" id="copyCustomChoice">
            <template v-slot="props">
                <select v-model="choice" class="form-control" :class="props.cls" id="copyCustomChoice">
                <option value="favorite">Favorite</option>
                <option value="yes">Yes</option>
                <option value="maybe">Maybe</option>
                <option value="no">No</option>
                </select>
            </template>
        </form-group>
        <form-group field="target" :errors="formErrors" label="Target Character" id="copyCustomTarget">
            <template v-slot="props">
                <character-select v-model="target" :class="props.cls" id="copyCustomTarget"></character-select>
            </template>
        </form-group>
    </modal>
</template>

<script lang="ts">
    import CustomDialog from '../../components/custom_dialog';
    import FormGroup from '../../components/form_group.vue';
    import Modal from '../../components/Modal.vue';
    import {KinkChoice} from '../../interfaces';
    import * as Utils from '../utils';
    import {methods} from './data_store';

    const CopyCustomDialog = CustomDialog.extend({
        components: {'form-group': FormGroup, modal: Modal},
        data() {
            return {
                name: '',
                description: '',
                choice: 'favorite' as KinkChoice,
                target: Utils.settings.defaultCharacter,
                formErrors: {},
                submitting: false
            };
        },
        computed: {
            valid(): boolean {
                return this.name.length > 0 && this.description.length > 0;
            }
        },
        methods: {
            showDialog(name: string, description: string): void {
                this.name = name;
                this.description = description;
                this.show();
            },
            async copyCustom(): Promise<void> {
                try {
                    this.formErrors = {};
                    this.submitting = true;
                    await methods.characterCustomKinkAdd(this.target, this.name, this.description, this.choice);
                    this.submitting = false;
                    this.hide();
                } catch(e) {
                    this.submitting = false;
                    if(Utils.isJSONError(e))
                        this.formErrors = e.response.data;
                    else
                        Utils.ajaxError(e, 'Unable to copy custom kink');
                }
            }
        }
    });
    type CopyCustomDialog = InstanceType<typeof CopyCustomDialog>;
    export default CopyCustomDialog;
</script>