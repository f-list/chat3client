<template>
    <dropdown class="filterable-select" linkClass="custom-select" :keepOpen="true">
        <template slot="title" v-if="multiple">{{label}}</template>
        <slot v-else slot="title" :option="selected">{{label}}</slot>

        <div style="padding:10px;">
            <input v-model="filter" class="form-control" :placeholder="placeholder" @mousedown.stop/>
        </div>
        <div class="dropdown-items">
            <template v-if="multiple">
                <a href="#" @click.stop="select(option)" v-for="option in filtered" class="dropdown-item">
                    <input type="checkbox" :checked="isSelected(option)"/>
                    <slot :option="option">{{option}}</slot>
                </a>
            </template>
            <template v-else>
                <a href="#" @click="select(option)" v-for="option in filtered" class="dropdown-item">
                    <slot :option="option">{{option}}</slot>
                </a>
            </template>
        </div>
    </dropdown>
</template>

<script lang="ts">
    import Vue, {PropOptions} from 'vue';
    import Dropdown from '../components/Dropdown.vue';

    const FilterableSelect = Vue.extend({
        components: {dropdown: Dropdown},
        props: {
            placeholder: {} as PropOptions<string | undefined>,
            options: {required: true} as PropOptions<object[]>,
            filterFunc: {default: () => ((filter: RegExp, value: string) => filter.test(value))} as PropOptions<(filter: RegExp, value: object) => boolean>,
            multiple: {} as PropOptions<true | undefined>,
            value: {} as PropOptions<object | object[] | undefined>,
            title: {} as PropOptions<string | undefined>
        },
        data() {
            return {
                filter: '',
                selected: (this.value !== undefined ? this.value : (this.multiple !== undefined ? [] : undefined)) as object | object[] | undefined
            };
        },
        computed: {
            filtered(): object[] {
                return this.options.filter((x) => this.filterFunc(this.filterRegex, x));
            },
            label(): string | undefined {
                return this.multiple !== undefined ? `${this.title} - ${(<object[]>this.selected).length}` :
                    (this.selected !== undefined ? this.selected.toString() : this.title);
            },
            filterRegex(): RegExp {
                return new RegExp(this.filter.replace(/[^\w]/gi, '\\$&'), 'i');
            }
        },
        watch: {
            value: 'watchValue'
        },
        methods: {
            watchValue(newValue: object | object[] | undefined): void {
                this.selected = newValue;
            },
            select(item: object): void {
                if(this.multiple !== undefined) {
                    const selected = <object[]>this.selected;
                    const index = selected.indexOf(item);
                    if(index === -1) selected.push(item);
                    else selected.splice(index, 1);
                } else
                    this.selected = item;
                this.$emit('input', this.selected);
            },
            isSelected(option: object): boolean {
                return (<object[]>this.selected).indexOf(option) !== -1;
            }
        }
    });
    type FilterableSelect = InstanceType<typeof FilterableSelect>;
    export default FilterableSelect;
</script>

<style lang="scss">
    .filterable-select {
        .dropdown-items {
            max-height: 200px;
            overflow-y: auto;
        }

        button {
            display: flex;
            text-align: left
        }

        input[type=checkbox] {
            vertical-align: text-bottom;
            margin-right: 5px;
        }
    }
</style>