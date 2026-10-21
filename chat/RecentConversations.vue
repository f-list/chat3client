<template>
    <modal :buttons="false" :action="l('chat.recentConversations')" dialogClass="w-100 modal-lg">
        <tabs style="flex-shrink:0;margin-bottom:10px" v-model="selectedTab"
            :tabs="[l('chat.pms'), l('chat.channels')]"></tabs>
        <div>
            <div v-show="selectedTab === '0'" class="recent-conversations">
                <template v-for="recent in recentPrivate">
                    <user-view v-if="recent.character" :key="recent.character" :character="getCharacter(recent.character)"></user-view>
                </template>
            </div>
            <div v-show="selectedTab === '1'" class="recent-conversations">
                <channel-view v-for="recent in recentChannels" :key="recent.channel" :id="recent.channel"
                    :text="recent.name"></channel-view>
            </div>
        </div>
    </modal>
</template>

<script lang="ts">
    import CustomDialog from '../components/custom_dialog';
    import Modal from '../components/Modal.vue';
    import Tabs from '../components/tabs';
    import ChannelView from './ChannelTagView.vue';
    import core from './core';
    import {Character, Conversation} from './interfaces';
    import l from './localize';
    import UserView from './user_view';

    const RecentConversations = CustomDialog.extend({
        components: {'user-view': UserView, 'channel-view': ChannelView, modal: Modal, tabs: Tabs},
        data() {
            return {
                l: l,
                selectedTab: '0'
            };
        },
        computed: {
            recentPrivate(): ReadonlyArray<Conversation.RecentPrivateConversation> {
                return core.conversations.recent;
            },
            recentChannels(): ReadonlyArray<Conversation.RecentChannelConversation> {
                return core.conversations.recentChannels;
            }
        },
        methods: {
            getCharacter(name: string): Character {
                return core.characters.get(name);
            }
        }
    });
    type RecentConversations = InstanceType<typeof RecentConversations>;
    export default RecentConversations;
</script>

<style lang="scss">
    .recent-conversations {
        display: flex;
        flex-direction: column;
        max-height: 500px;
        flex-wrap: wrap;
        & > * {
            margin: 3px;
        }
    }
</style>