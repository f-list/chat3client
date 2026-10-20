<template>
    <div class="d-flex w-100 my-2 justify-content-between">
        <div>
            <slot name="previous" v-if="!routed">
                <a class="btn btn-secondary" :class="{'disabled': !prev}" role="button" @click.prevent="previousPage()">
                    <span aria-hidden="true">&larr;</span> {{prevLabel}}
                </a>
            </slot>
            <router-link v-else :to="prevRoute" class="btn btn-secondary" :class="{'disabled': !prev}" role="button">
                <span aria-hidden="true">&larr;</span> {{prevLabel}}
            </router-link>
        </div>
        <div>
            <slot name="next" v-if="!routed">
                <a class="btn btn-secondary" :class="{'disabled': !next}" role="button" @click.prevent="nextPage()">
                    {{nextLabel}} <span aria-hidden="true">&rarr;</span>
                </a>
            </slot>
            <router-link v-else :to="nextRoute" class="btn btn-secondary" :class="{'disabled': !next}" role="button">
                {{nextLabel}} <span aria-hidden="true">&rarr;</span>
            </router-link>
        </div>
    </div>
</template>

<script lang="ts">
    import cloneDeep = require('lodash/cloneDeep'); //tslint:disable-line:no-require-imports
    import Vue, {PropOptions} from 'vue';

    type ParamDictionary = {[key: string]: number | undefined};
    interface RouteParams {
        name?: string
        params?: ParamDictionary
    }

    const SimplePager = Vue.extend({
        props: {
            nextLabel: {default: 'Next Page'} as PropOptions<string>,
            prevLabel: {default: 'Previous Page'} as PropOptions<string>,
            next: {required: true} as PropOptions<boolean>,
            prev: {required: true} as PropOptions<boolean>,
            routed: {default: false} as PropOptions<boolean>,
            route: {default(this: Vue & {$route: RouteParams}): RouteParams { return this.$route; }} as PropOptions<RouteParams>,
            paramName: {default: 'page'} as PropOptions<string>
        },
        computed: {
            prevRoute(): RouteParams {
                if(this.route.params !== undefined && this.route.params[this.paramName] !== undefined) {
                    const newPage = this.route.params[this.paramName]! - 1;
                    const clone = cloneDeep(this.route);
                    clone.params![this.paramName] = newPage;
                    return clone;
                }
                return {};
            },
            nextRoute(): RouteParams {
                if(this.route.params !== undefined && this.route.params[this.paramName] !== undefined) {
                    const newPage = this.route.params[this.paramName]! + 1;
                    const clone = cloneDeep(this.route);
                    clone.params![this.paramName] = newPage;
                    return clone;
                }
                return {};
            }
        },
        methods: {
            nextPage(): void {
                if(!this.next)
                    return;
                this.$emit('next');
            },
            previousPage(): void {
                if(!this.prev)
                    return;
                this.$emit('prev');
            }
        }
    });
    type SimplePager = InstanceType<typeof SimplePager>;
    export default SimplePager;
</script>