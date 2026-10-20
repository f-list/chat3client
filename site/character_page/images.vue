<template>
    <div class="character-images row">
        <div v-show="loading" class="alert alert-info">Loading images.</div>
        <template v-if="!loading">
            <div class="character-image col-6 col-sm-4 col-md-2" v-for="image in images" :key="image.id">
                <a :href="imageUrl(image)" target="_blank" @click="handleImageClick($event, image)">
                    <img :src="thumbUrl(image)" :title="image.description">
                </a>
            </div>
        </template>
        <div v-if="!loading && !images.length" class="alert alert-info">No images.</div>
        <div class="image-preview" v-show="previewImage" @click="previewImage = ''">
            <img :src="previewImage"/>
            <div class="modal-backdrop show"></div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue, {PropOptions} from 'vue';
    import {CharacterImage} from '../../interfaces';
    import * as Utils from '../utils';
    import {methods} from './data_store';
    import {Character} from './interfaces';

    const ImagesView = Vue.extend({
        props: {
            character: {required: true} as PropOptions<Character>,
            usePreview: {} as PropOptions<boolean | undefined>
        },
        data() {
            return {
                shown: false,
                previewImage: '',
                images: [] as CharacterImage[],
                loading: true,
                error: '',
                imageUrl: (image: CharacterImage) => methods.imageUrl(image),
                thumbUrl: (image: CharacterImage) => methods.imageThumbUrl(image)
            };
        },
        methods: {
            async show(): Promise<void> {
                if(this.shown) return;
                try {
                    this.error = '';
                    this.shown = true;
                    this.loading = true;
                    this.images = await methods.imagesGet(this.character.character.id);
                } catch(e) {
                    this.shown = false;
                    if(Utils.isJSONError(e))
                        this.error = <string>e.response.data.error;
                    Utils.ajaxError(e, 'Unable to load images.');
                }
                this.loading = false;
            },
            handleImageClick(e: MouseEvent, image: CharacterImage): void {
                if(this.usePreview) {
                    this.previewImage = methods.imageUrl(image);
                    e.preventDefault();
                }
            }
        }
    });
    type ImagesView = InstanceType<typeof ImagesView>;
    export default ImagesView;
</script>