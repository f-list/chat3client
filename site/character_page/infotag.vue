<template>
    <div class="infotag">
        <span class="infotag-label">{{infotag.name}}: </span>
        <span v-if="infotag.infotag_group !== contactGroupId" class="infotag-value">{{value}}</span>
        <span v-else class="infotag-value"><a :href="contactLink">{{contactValue}}</a></span>
    </div>
</template>

<script lang="ts">
    import Vue, {PropOptions} from 'vue';
    import {CharacterInfotag, Infotag, ListItem} from '../../interfaces';
    import {formatContactLink, formatContactValue} from './contact_utils';
    import {Store} from './data_store';
    import {CONTACT_GROUP_ID} from './interfaces';

    const InfotagView = Vue.extend({
        props: {
            infotag: {required: true} as PropOptions<Infotag>,
            data: {required: true} as PropOptions<CharacterInfotag>
        },
        data() {
            return {
                contactGroupId: CONTACT_GROUP_ID
            };
        },
        computed: {
            contactLink(): string | undefined {
                return formatContactLink(this.infotag, this.data.string!);
            },
            contactValue(): string {
                return formatContactValue(this.infotag, this.data.string!);
            },
            value(): string {
                switch(this.infotag.type) {
                    case 'text':
                        return this.data.string!;
                    case 'number':
                        if(this.infotag.allow_legacy && !this.data.number)
                            return this.data.string !== undefined ? this.data.string : '';
                        return this.data.number!.toPrecision();
                }
                const listitem = <ListItem | undefined>Store.shared.listItems[this.data.list!];
                if(typeof listitem === 'undefined')
                    return '';
                return listitem.value;
            }
        }
    });
    type InfotagView = InstanceType<typeof InfotagView>;
    export default InfotagView;
</script>