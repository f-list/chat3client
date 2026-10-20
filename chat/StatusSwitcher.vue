<template>
    <modal :action="l('chat.setStatus')" @submit="setStatus" @close="reset" dialogClass="w-100 modal-lg">
        <div class="form-group" id="statusSelector">
            <label class="control-label">{{l('chat.setStatus.status')}}</label>
            <dropdown linkClass="custom-select">
                <span slot="title"><span class="fa fa-fw" :class="getStatusIcon(status)"></span>{{l('status.' + status)}}</span>
                <a href="#" class="dropdown-item" v-for="item in statuses" @click.prevent="status = item">
                    <span class="fa fa-fw" :class="getStatusIcon(item)"></span>{{l('status.' + item)}}
                </a>
            </dropdown>
        </div>
        <div class="form-group">
            <label class="control-label">{{l('chat.setStatus.message')}}</label>
            <editor id="text" v-model="text" classes="form-control" maxlength="255">
                <div class="bbcode-editor-controls">
                    {{getByteLength(text)}} / 255
                </div>
            </editor>
        </div>
    </modal>
</template>

<script lang="ts">
    import CustomDialog from '../components/custom_dialog';
    import Dropdown from '../components/Dropdown.vue';
    import Modal from '../components/Modal.vue';
    import {Editor} from './bbcode';
    import {getByteLength} from './common';
    import core from './core';
    import {Character, userStatuses} from './interfaces';
    import l from './localize';
    import {getStatusIcon} from './user_view';

    const StatusSwitcher = CustomDialog.extend({
        components: {modal: Modal, editor: Editor, dropdown: Dropdown},
        data() {
            return {
                selectedStatus: undefined as Character.Status | undefined,
                enteredText: undefined as string | undefined,
                statuses: userStatuses,
                l: l,
                getByteLength: getByteLength,
                getStatusIcon: getStatusIcon
            };
        },
        computed: {
            status: {
                get(): Character.Status {
                    return this.selectedStatus !== undefined ? this.selectedStatus : this.character.status;
                },
                set(status: Character.Status) {
                    this.selectedStatus = status;
                }
            },
            text: {
                get(): string {
                    return this.enteredText !== undefined ? this.enteredText : this.character.statusText;
                },
                set(text: string) {
                    this.enteredText = text;
                }
            },
            character(): Character {
                return core.characters.ownCharacter;
            }
        },
        methods: {
            setStatus(): void {
                core.connection.send('STA', {status: this.status, statusmsg: this.text});
            },
            reset(): void {
                this.selectedStatus = undefined;
                this.enteredText = undefined;
            }
        }
    });
    type StatusSwitcher = InstanceType<typeof StatusSwitcher>;
    export default StatusSwitcher;
</script>