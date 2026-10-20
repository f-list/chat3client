<template>
    <div class="contact-method" :title="infotag.name">
        <span v-if="contactLink" class="contact-link">
            <a :href="contactLink" target="_blank" rel="nofollow noreferrer noopener">
                <img :src="iconUrl"><span class="contact-value">{{value}}</span>
            </a>
        </span>
        <span v-else>
            <img :src="iconUrl"><span class="contact-value">{{value}}</span>
        </span>
    </div>
</template>

<script lang="ts">
    import Vue, {PropOptions} from 'vue';
    import {CharacterInfotag, Infotag} from '../../interfaces';
    import {formatContactLink, formatContactValue} from './contact_utils';
    import {methods} from './data_store';

    const ContactMethodView = Vue.extend({
        props: {
            infotag: {required: true} as PropOptions<Infotag>,
            data: {required: true} as PropOptions<CharacterInfotag>
        },
        computed: {
            iconUrl(): string {
                return methods.contactMethodIconUrl(this.infotag.name);
            },
            value(): string {
                return formatContactValue(this.infotag, this.data.string!);
            },
            contactLink(): string | undefined {
                return formatContactLink(this.infotag, this.data.string!);
            }
        }
    });
    type ContactMethodView = InstanceType<typeof ContactMethodView>;
    export default ContactMethodView;
</script>