<script lang="ts">
import Vue, {VNode} from 'vue';

export default Vue.extend({
	props: {
		tag: {
			type: String,
			default: 'div',
		},
	},
	data() {
		return {
			hovered: false,
			closeTimeout: null as number | null,
		};
	},
	render(h): VNode {
		return h(this.tag, {
			on: {
				mouseenter: this.mouseenter,
				mouseleave: this.mouseleave,
			},
		}, this.$scopedSlots.default?.({
			hovered: this.hovered,
		}));
	},
	methods: {
		mouseenter(event: MouseEvent) {
			if (this.closeTimeout) {
				clearTimeout(this.closeTimeout);
				this.closeTimeout = null;
			} else {
				this.hovered = true;
			}
		},
		mouseleave(event: MouseEvent) {
			this.closeTimeout = setTimeout(() => {
				this.hovered = false;
				this.closeTimeout = null;
			}, 50) as unknown as number;
		},
	},
});
</script>
