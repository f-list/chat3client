<template>
    <div class="row character-page" id="pageBody">
        <div class="col-12" style="min-height:0">
            <div class="alert alert-info" v-show="loading">Loading character information.</div>
            <div class="alert alert-danger" v-show="error">{{error}}</div>
        </div>
        <div class="col-md-4 col-lg-3 col-xl-2" v-if="!loading && character">
            <sidebar :character="character" @memo="memo" :oldApi="oldApi"></sidebar>
        </div>
        <div class="col-md-8 col-lg-9 col-xl-10 profile-body" v-if="!loading && character">
            <div id="characterView">
                <div>
                    <div v-if="character.ban_reason" id="headerBanReason" class="alert alert-warning">
                        This character has been banned and is not visible to the public. Reason:
                        <br/> {{ character.ban_reason }}
                        <template v-if="character.timeout"><br/>Timeout expires:
                            <date :time="character.timeout"></date>
                        </template>
                    </div>
                    <div v-if="character.block_reason" id="headerBlocked" class="alert alert-warning">
                        This character has been blocked and is not visible to the public. Reason:
                        <br/> {{ character.block_reason }}
                    </div>
                    <div v-if="character.memo" id="headerCharacterMemo" class="alert alert-info">Memo: {{ character.memo.memo }}</div>
                    <div class="card bg-light">
                        <div class="card-header">
                            <tabs class="card-header-tabs" v-model="tab">
                                <span>Overview</span>
                                <span>Info</span>
                                <span v-if="!oldApi">Groups</span>
                                <span>Images ({{ character.character.image_count }})</span>
                                <span v-if="character.settings.guestbook">Guestbook</span>
                                <span v-if="character.is_self || character.settings.show_friends">Friends</span>
                            </tabs>
                        </div>
                        <div class="card-body">
                            <div role="tabpanel" v-show="tab === '0'">
                                <div style="margin-bottom:10px">
                                    <bbcode :text="character.character.description"></bbcode>
                                </div>
                                <character-kinks :character="character" :oldApi="oldApi" ref="tab0"></character-kinks>
                            </div>
                            <div role="tabpanel" v-show="tab === '1'">
                                <character-infotags :character="character" ref="tab1"></character-infotags>
                            </div>
                            <div role="tabpanel" v-show="tab === '2'" v-if="!oldApi">
                                <character-groups :character="character" ref="tab2"></character-groups>
                            </div>
                            <div role="tabpanel" v-show="tab === '3'">
                                <character-images :character="character" ref="tab3" :use-preview="imagePreview"></character-images>
                            </div>
                            <div v-if="character.settings.guestbook" role="tabpanel" v-show="tab === '4'">
                                <character-guestbook :character="character" :oldApi="oldApi" ref="tab4"></character-guestbook>
                            </div>
                            <div v-if="character.is_self || character.settings.show_friends" role="tabpanel" v-show="tab === '5'">
                                <character-friends :character="character" ref="tab5"></character-friends>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue, {PropOptions} from 'vue';
    import {StandardBBCodeParser} from '../../bbcode/standard';
    import {BBCodeView} from '../../bbcode/view';
    import DateDisplay from '../../components/date_display.vue';
    import Tabs from '../../components/tabs';
    import * as Utils from '../utils';
    import {methods, Store} from './data_store';
    import FriendsView from './friends.vue';
    import GroupsView from './groups.vue';
    import GuestbookView from './guestbook.vue';
    import ImagesView from './images.vue';
    import InfotagsView from './infotags.vue';
    import {Character, SharedStore} from './interfaces';
    import CharacterKinksView from './kinks.vue';
    import Sidebar from './sidebar.vue';

    interface ShowableVueTab extends Vue {
        show?(): void
    }

    const standardParser = new StandardBBCodeParser();

    const CharacterPage = Vue.extend({
        components: {
            sidebar: Sidebar, date: DateDisplay, 'character-friends': FriendsView, 'character-guestbook': GuestbookView,
            'character-groups': GroupsView, 'character-infotags': InfotagsView, 'character-images': ImagesView, tabs: Tabs,
            'character-kinks': CharacterKinksView, bbcode: BBCodeView(standardParser)
        },
        props: {
            name: {} as PropOptions<string | undefined>,
            id: {} as PropOptions<number | undefined>,
            authenticated: {required: true} as PropOptions<boolean>,
            oldApi: {} as PropOptions<true | undefined>,
            imagePreview: {} as PropOptions<true | undefined>
        },
        data() {
            return {
                shared: Store as SharedStore,
                character: undefined as Character | undefined,
                loading: true,
                error: '',
                tab: '0'
            };
        },
        watch: {
            tab: 'switchTabHook',
            name: 'onCharacterSet'
        },
        beforeMount(): void {
            this.shared.authenticated = this.authenticated;
        },
        async mounted(): Promise<void> {
            if(this.character === undefined) await this._getCharacter();
        },
        methods: {
            switchTabHook(): void {
                const target = <ShowableVueTab>this.$refs[`tab${this.tab}`];
                //tslint:disable-next-line:no-unbound-method
                if(typeof target.show === 'function') target.show();
            },
            async onCharacterSet(): Promise<void> {
                this.tab = '0';
                return this._getCharacter();
            },
            memo(memo: {id: number, memo: string}): void {
                Vue.set(this.character!, 'memo', memo);
            },
            async _getCharacter(): Promise<void> {
                this.error = '';
                this.character = undefined;
                if((this.name === undefined || this.name.length === 0) && !this.id)
                    return;
                try {
                    this.loading = true;
                    await methods.fieldsGet();
                    this.character = await methods.characterData(this.name, this.id);
                    standardParser.inlines = this.character.character.inlines;
                } catch(e) {
                    this.error = Utils.isJSONError(e) ? <string>e.response.data.error : (<Error>e).message;
                    Utils.ajaxError(e, 'Failed to load character information.');
                }
                this.loading = false;
            }
        }
    });
    type CharacterPage = InstanceType<typeof CharacterPage>;
    export default CharacterPage;
</script>