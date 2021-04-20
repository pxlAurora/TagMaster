<script lang="ts">
import Vue, {VNode} from 'vue';

export default Vue.extend({
	props: {
		tag: {
			type: String,
			default: 'div',
		},
		floating: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			mouseMoveHandler: null as typeof window['onmousemove'],
			mouseUpHandler: null as typeof window['onmouseup'],
			windowResizeHandler: null as typeof window['onresize'],
			dragging: false,
			position: [0, 0] as [number, number],
		};
	},
	watch: {
		floating() {
			// Position the element to exactly where it was when it became floating.
			const bb = this.$el.getBoundingClientRect();
			const style = window.getComputedStyle(this.$el);
			this.position = [bb.left - parseFloat(style.marginLeft), bb.top - parseFloat(style.marginTop)];
		},
	},
	render(h): VNode {
		return h(this.tag, {
			class: {
				floating: this.floating,
			},
			style: this.getFloatingStyles(),
		}, this.$scopedSlots.default?.({
			dragging: this.dragging,
			onMouseDown: this.onMouseDown,
		}) ?? []);
	},
	mounted() {
		// Always register floating related listeners in case the floating prop changes.
		this.mouseMoveHandler = this.onMouseMove.bind(this);
		window.addEventListener('mousemove', this.mouseMoveHandler);
		this.mouseUpHandler = () => this.dragging = false;
		window.addEventListener('mouseup', this.mouseUpHandler);
		this.windowResizeHandler = this.$forceUpdate.bind(this);
		window.addEventListener('resize', this.windowResizeHandler);
	},
	beforeDestroy() {
		if (this.mouseMoveHandler) window.removeEventListener('mousemove', this.mouseMoveHandler);
		if (this.mouseUpHandler) window.removeEventListener('mouseup', this.mouseUpHandler);
		if (this.windowResizeHandler) window.removeEventListener('resize', this.windowResizeHandler);
	},
	methods: {
		onMouseDown() {
			if (!this.floating) return;

			this.dragging = true;

			// Fix position being out of bounds at the start of drag.
			const style = this.getFloatingStyles();
			this.position = [
				parseFloat(style.left),
				parseFloat(style.top),
			];
		},
		onMouseMove(event: MouseEvent) {
			if (!this.dragging || !this.floating) return;

			this.position = [this.position[0] + event.movementX, this.position[1] + event.movementY];
		},
		getFloatingStyles(): Record<string, any> {
			if (!this.floating) return {};

			let maxHeight: string | undefined = undefined;
			let maxSize: [number, number] = [window.innerWidth, window.innerHeight];

			if (this.$el) {
				const style = window.getComputedStyle(this.$el);

				maxHeight = `${window.innerHeight - Math.max(0, this.position[1]) - parseFloat(style.marginTop) - parseFloat(style.marginBottom)}px`;
				maxSize[0] -= this.$el.clientWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
				maxSize[1] -= this.$el.clientHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
			};

			return {
				left: `${Math.max(0, Math.min(maxSize[0], this.position[0]))}px`,
				top: `${Math.max(0, Math.min(maxSize[1], this.position[1]))}px`,
				maxHeight,
			};
		},
	},
});
</script>

<style lang="stylus" scoped>
.floating {
	z-index: 10;
	position: fixed;
	width: 300px;
	max-height: 100vh;
}
</style>
