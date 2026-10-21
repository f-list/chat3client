<template>
    <div class="character-kink" :class="kinkClasses" :id="kink.key" @click="toggleSubkinks"
        @mouseover.stop="showTooltip = true" @mouseout.stop="showTooltip = false">
        <i v-show="kink.hasSubkinks" class="fa" :class="{'fa-minus': !listClosed, 'fa-plus': listClosed}"></i>
        <i v-show="!kink.hasSubkinks && kink.isCustom" class="far fa-dot-circle custom-kink-icon"></i>
        <span class="kink-name">{{ kink.name }}</span>
        <template v-if="kink.hasSubkinks">
            <div class="subkink-list" :class="{closed: listClosed}">
                <kink v-for="subkink in kink.subkinks" :kink="subkink" :key="subkink.id" :comparisons="comparisons"
                    :highlights="highlights"></kink>
            </div>
        </template>
        <div class="popover popover-top" v-if="showTooltip" style="display:block;bottom:100%;top:initial;margin-bottom:5px">
            <div class="arrow" style="left:10%"></div>
            <h5 class="popover-header">{{kink.name}}</h5>
            <div class="popover-body"><p>{{kink.description}}</p></div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue, {PropOptions} from 'vue';
    import {DisplayKink} from './interfaces';

    const KinkView = Vue.extend({
        name: 'kink',
        props: {
            kink: {required: true} as PropOptions<DisplayKink>,
            highlights: {required: true} as PropOptions<{[key: number]: boolean}>,
            comparisons: {required: true} as PropOptions<{[key: number]: string | undefined}>
        },
        data() {
            return {
                listClosed: true,
                showTooltip: false
            };
        },
        computed: {
            kinkClasses(): {[key: string]: boolean} {
                const classes: {[key: string]: boolean} = {
                    'stock-kink': !this.kink.isCustom,
                    'custom-kink': this.kink.isCustom,
                    highlighted: !this.kink.isCustom && this.highlights[this.kink.id],
                    subkink: this.kink.hasSubkinks
                };
                classes[`kink-id-${this.kink.key}`] = true;
                classes[`kink-group-${this.kink.group}`] = true;
                if(!this.kink.isCustom && typeof this.comparisons[this.kink.id] !== 'undefined')
                    classes[`comparison-${this.comparisons[this.kink.id]}`] = true;
                return classes;
            },
            customId(): number | undefined {
                return this.kink.isCustom ? this.kink.id : undefined;
            }
        },
        methods: {
            toggleSubkinks(): void {
                if(!this.kink.hasSubkinks)
                    return;
                this.listClosed = !this.listClosed;
            }
        }
    });
    type KinkView = InstanceType<typeof KinkView>;
    export default KinkView;
</script>