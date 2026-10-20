<template>
    <div class="sidebar-wrapper" :class="{open: expanded}">
        <div :class="'sidebar sidebar-' + (right ? 'right' : 'left')">
            <button @click="expanded = !expanded" class="btn btn-secondary btn-xs expander" :aria-label="label">
                <span :class="'fa fa-fw fa-rotate-270 ' + icon" v-if="right"></span>
                <span class="fa" :class="{'fa-chevron-down': !expanded, 'fa-chevron-up': expanded}"></span>
                <span :class="'fa fa-fw fa-rotate-90 ' + icon" v-if="!right"></span>
            </button>
            <div class="body">
                <slot></slot>
            </div>
        </div>
        <div class="modal-backdrop show" @click="expanded = false"></div>
    </div>
</template>

<script lang="ts">
    import Vue, {PropOptions} from 'vue';

    const Sidebar = Vue.extend({
        props: {
            right: {} as PropOptions<true | undefined>,
            label: {} as PropOptions<string | undefined>,
            icon: {required: true} as PropOptions<string>,
            open: {default: false} as PropOptions<boolean>
        },
        data() {
            return {
                expanded: this.open
            };
        },
        watch: {
            open: 'watchOpen'
        },
        methods: {
            watchOpen(): void {
                this.expanded = this.open;
            }
        }
    });
    type Sidebar = InstanceType<typeof Sidebar>;
    export default Sidebar;
</script>