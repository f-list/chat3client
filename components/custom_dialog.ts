import Vue from 'vue';
import Modal from './Modal.vue';

const CustomDialog = Vue.extend({
    components: {Modal},
    computed: {
        dialog(): Modal {
            return <Modal>this.$children[0];
        }
    },
    methods: {
        show(): void {
            this.dialog.show();
        },
        hide(): void {
            this.dialog.hide();
        }
    }
});
type CustomDialog = InstanceType<typeof CustomDialog>;
export default CustomDialog;