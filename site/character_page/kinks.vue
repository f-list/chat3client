<template>
    <div class="character-kinks-block" @contextmenu="contextMenu" @touchstart="contextMenu" @touchend="contextMenu">
        <div class="compare-highlight-block d-flex justify-content-between">
            <div v-if="shared.authenticated" class="quick-compare-block form-inline">
                <character-select v-model="characterToCompare"></character-select>
                <button class="btn btn-primary" @click="compareKinks" :disabled="loading || !characterToCompare">
                    {{ compareButtonText }}
                </button>
            </div>
            <div class="form-inline">
                <select v-model="highlightGroup" class="form-control">
                    <option :value="undefined">None</option>
                    <template v-for="group in kinkGroups">
                        <option v-if="group" :value="group.id" :key="group.id">{{group.name}}</option>
                    </template>
                </select>
            </div>
        </div>
        <div class="form-row mt-3">
            <div class="col-sm-6 col-lg-3">
                <div class="card bg-light">
                    <div class="card-header">
                        <h4>Favorites</h4>
                    </div>
                    <div class="card-body">
                        <kink v-for="kink in groupedKinks['favorite']" :kink="kink" :key="kink.key" :highlights="highlighting"
                            :comparisons="comparison"></kink>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-lg-3">
                <div class="card bg-light">
                    <div class="card-header">
                        <h4>Yes</h4>
                    </div>
                    <div class="card-body">
                        <kink v-for="kink in groupedKinks['yes']" :kink="kink" :key="kink.key" :highlights="highlighting"
                            :comparisons="comparison"></kink>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-lg-3">
                <div class="card bg-light">
                    <div class="card-header">
                        <h4>Maybe</h4>
                    </div>
                    <div class="card-body">
                        <kink v-for="kink in groupedKinks['maybe']" :kink="kink" :key="kink.key" :highlights="highlighting"
                            :comparisons="comparison"></kink>
                    </div>
                </div>
            </div>
            <div class="col-sm-6 col-lg-3">
                <div class="card bg-light">
                    <div class="card-header">
                        <h4>No</h4>
                    </div>
                    <div class="card-body">
                        <kink v-for="kink in groupedKinks['no']" :kink="kink" :key="kink.key" :highlights="highlighting"
                            :comparisons="comparison"></kink>
                    </div>
                </div>
            </div>
        </div>
        <context-menu v-if="shared.authenticated && !oldApi" prop-name="custom" ref="context-menu"></context-menu>
    </div>
</template>

<script lang="ts">
    import Vue, {PropOptions} from 'vue';
    import {Kink, KinkChoice, KinkGroup} from '../../interfaces';
    import * as Utils from '../utils';
    import CopyCustomMenu from './copy_custom_menu.vue';
    import {methods, Store} from './data_store';
    import {Character, DisplayKink} from './interfaces';
    import KinkView from './kink.vue';

    const CharacterKinksView = Vue.extend({
        components: {'context-menu': CopyCustomMenu, kink: KinkView},
        props: {
            character: {required: true} as PropOptions<Character>,
            oldApi: {} as PropOptions<true | undefined>
        },
        data() {
            return {
                shared: Store,
                characterToCompare: Utils.settings.defaultCharacter,
                highlightGroup: undefined as number | undefined,
                loading: false,
                comparing: false,
                highlighting: {} as {[key: string]: boolean},
                comparison: {} as {[key: string]: KinkChoice}
            };
        },
        computed: {
            kinkGroups(): {[key: string]: KinkGroup | undefined} {
                return Store.shared.kinkGroups;
            },
            compareButtonText(): string {
                if(this.loading)
                    return 'Loading...';
                return this.comparing ? 'Clear' : 'Compare';
            },
            groupedKinks(): {[key in KinkChoice]: DisplayKink[]} {
                const kinks = Store.shared.kinks;
                const characterKinks = this.character.character.kinks;
                const characterCustoms = this.character.character.customs;
                const displayCustoms: {[key: string]: DisplayKink | undefined} = {};
                const outputKinks: {[key: string]: DisplayKink[]} = {favorite: [], yes: [], maybe: [], no: []};
                const makeKink = (kink: Kink): DisplayKink => ({
                    id: kink.id,
                    name: kink.name,
                    description: kink.description,
                    group: kink.kink_group,
                    isCustom: false,
                    hasSubkinks: false,
                    ignore: false,
                    subkinks: [],
                    key: kink.id.toString()
                });
                const kinkSorter = (a: DisplayKink, b: DisplayKink) => {
                    if(this.character.settings.customs_first && a.isCustom !== b.isCustom)
                        return a.isCustom < b.isCustom ? 1 : -1;

                    if(a.name === b.name)
                        return 0;
                    return a.name < b.name ? -1 : 1;
                };

                for(const id in characterCustoms) {
                    const custom = characterCustoms[id]!;
                    displayCustoms[id] = {
                        id: custom.id,
                        name: custom.name,
                        description: custom.description,
                        choice: custom.choice,
                        group: -1,
                        isCustom: true,
                        hasSubkinks: false,
                        ignore: false,
                        subkinks: [],
                        key: `c${custom.id}`
                    };
                }

                for(const kinkId in characterKinks) {
                    const kinkChoice = characterKinks[kinkId]!;
                    const kink = <Kink | undefined>kinks[kinkId];
                    if(kink === undefined) continue;
                    const newKink = makeKink(kink);
                    if(typeof kinkChoice === 'number' && typeof displayCustoms[kinkChoice] !== 'undefined') {
                        const custom = displayCustoms[kinkChoice]!;
                        newKink.ignore = true;
                        custom.hasSubkinks = true;
                        custom.subkinks.push(newKink);
                    }
                    if(!newKink.ignore)
                        outputKinks[kinkChoice].push(newKink);
                }

                for(const customId in displayCustoms) {
                    const custom = displayCustoms[customId]!;
                    if(custom.hasSubkinks)
                        custom.subkinks.sort(kinkSorter);
                    outputKinks[<string>custom.choice].push(custom);
                }

                for(const choice in outputKinks)
                    outputKinks[choice].sort(kinkSorter);

                return <{[key in KinkChoice]: DisplayKink[]}>outputKinks;
            }
        },
        watch: {
            highlightGroup: 'highlightKinks'
        },
        methods: {
            async compareKinks(): Promise<void> {
                if(this.comparing) {
                    this.comparison = {};
                    this.comparing = false;
                    this.loading = false;
                    return;
                }

                try {
                    this.loading = true;
                    this.comparing = true;
                    const kinks = await methods.kinksGet(this.characterToCompare);
                    const toAssign: {[key: number]: KinkChoice} = {};
                    for(const kink of kinks)
                        toAssign[kink.id] = kink.choice;
                    this.comparison = toAssign;
                } catch(e) {
                    this.comparing = false;
                    this.comparison = {};
                    Utils.ajaxError(e, 'Unable to get kinks for comparison.');
                }
                this.loading = false;
            },
            highlightKinks(group: number | null): void {
                this.highlighting = {};
                if(group === null) return;
                const toAssign: {[key: string]: boolean} = {};
                for(const kinkId in Store.shared.kinks) {
                    const kink = Store.shared.kinks[kinkId];
                    if(kink.kink_group === group)
                        toAssign[kinkId] = true;
                }
                this.highlighting = toAssign;
            },
            contextMenu(event: MouseEvent | TouchEvent): void {
                if(this.shared.authenticated && !this.oldApi) (<InstanceType<typeof CopyCustomMenu>>this.$refs['context-menu']).outerClick(event);
            }
        }
    });
    type CharacterKinksView = InstanceType<typeof CharacterKinksView>;
    export default CharacterKinksView;
</script>