<template>
    <span class="localizable-date" :title="secondary">{{primary}}</span>
</template>

<script lang="ts">
    import {distanceInWordsToNow, format} from 'date-fns';
    import Vue, {PropOptions} from 'vue';
    import {settings} from '../site/utils';

    const DateDisplay = Vue.extend({
        props: {
            time: {required: true} as PropOptions<string | null | number>
        },
        data() {
            return {
                primary: undefined as string | undefined,
                secondary: undefined as string | undefined
            };
        },
        watch: {
            time: 'update'
        },
        mounted(): void {
            this.update();
        },
        methods: {
            update(): void {
                if(this.time === null || this.time === 0)
                    return;
                const date = isNaN(+this.time) ? new Date(`${this.time}+00:00`) : new Date(+this.time * 1000);
                const absolute = format(date, 'YYYY-MM-DD HH:mm');
                const relative = distanceInWordsToNow(date, {addSuffix: true});
                if(settings.fuzzyDates) {
                    this.primary = relative;
                    this.secondary = absolute;
                } else {
                    this.primary = absolute;
                    this.secondary = relative;
                }
            }
        }
    });
    type DateDisplay = InstanceType<typeof DateDisplay>;
    export default DateDisplay;
</script>