<template>
    <a href="#" @click.prevent="joinChannel()" :disabled="channel && channel.isJoined">
        <span class="fa fa-hashtag"></span>
        <template v-if="channel">{{channel.name}}<span class="bbcode-pseudo"> ({{channel.memberCount}})</span></template>
        <template v-else>{{text}}</template>
    </a>
</template>

<script lang="ts">
    import Vue, {PropOptions} from 'vue';
    import core from './core';
    import {Channel} from './interfaces';

    const ChannelView = Vue.extend({
        props: {
            id: {required: true} as PropOptions<string>,
            text: {required: true} as PropOptions<string>
        },
        computed: {
            channel(): Channel.ListItem | undefined {
                return core.channels.getChannelItem(this.id);
            }
        },
        mounted(): void {
            core.channels.requestChannelsIfNeeded(300000);
        },
        methods: {
            joinChannel(): void {
                if(this.channel === undefined || !this.channel.isJoined)
                    core.channels.join(this.id);
                const channel = core.conversations.byKey(`#${this.id}`);
                if(channel !== undefined) channel.show();
            }
        }
    });
    type ChannelView = InstanceType<typeof ChannelView>;
    export default ChannelView;
</script>