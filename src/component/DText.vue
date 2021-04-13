<script lang="ts">
import Vue from 'vue';

export enum TokenType {
	TEXT,
	WHITESPACE,
	BRACKET_LEFT,
	BRACKET_RIGHT,
	HASH,
	PIPE,
	SLASH,
	QUOTE,
	COLON,
}

type Tokens = [TokenType, string][];
type Parsed = (['text', string] | ['wiki', string, string] | ['link', string, string])[];

const parser = {
	tokenize(str: string): Tokens {
		let i = 0;
		const out: Tokens = [];

		while (i < str.length) {
			let c = str[i];
			i++;

			if (c === ' ' || c === '\t') {
				const a = /([ \t]+)/.exec(str.substr(i - 1));
				if (!a) throw new Error('this shouldnt happen');
				out.push([TokenType.WHITESPACE, a[1]]);
				i += a[1].length - 1;
			} else if (c === '[') {
				out.push([TokenType.BRACKET_LEFT, c]);
			} else if (c === ']') {
				out.push([TokenType.BRACKET_RIGHT, c]);
			} else if (c === '/') {
				out.push([TokenType.SLASH, c]);
			} else if (c === '#') {
				out.push([TokenType.HASH, c]);
			} else if (c === '|') {
				out.push([TokenType.PIPE, c]);
			} else if (c === '"') {
				out.push([TokenType.QUOTE, c]);
			} else if (c === ':') {
				out.push([TokenType.COLON, c]);
			} else {
				const a = /([^\[\]/#| \t":]+)/.exec(str.substr(i - 1));
				if (!a) throw new Error('this shouldnt happen');
				out.push([TokenType.TEXT, a[1]]);
				i += a[1].length - 1;
			}
		}

		return out;
	},
	parse(str: string): Parsed {
		const tokens = this.tokenize(str);
		const out: Parsed = [];

		return parser.parsePrimary(tokens, out);
	},
	parsePrimary(tokens: Tokens, out: Parsed) {
		while (tokens.length > 0) {
			const t = tokens[0];

			switch (t[0]) {
			case TokenType.BRACKET_LEFT:
				parser.parseBlock(tokens, out);
				break;
			case TokenType.TEXT:
			case TokenType.WHITESPACE:
				out.push(['text', parser.consumeNonSpecial(tokens)]);
				break;
			case TokenType.QUOTE:
				parser.parseLink(tokens, out);
				break;
			case TokenType.SLASH:
			case TokenType.HASH:
			case TokenType.PIPE:
			case TokenType.BRACKET_RIGHT:
				out.push(['text', tokens.shift()![1]]);
				break;
			default:
				tokens.shift();
			}
		}

		return out;
	},
	parseBlock(tokens: Tokens, out: Parsed) {
		if (tokens[1][0] === TokenType.BRACKET_LEFT) {
			tokens.splice(0, 2);
			const text = parser.consumeUntil(tokens, [TokenType.BRACKET_RIGHT, TokenType.PIPE]);
			if (tokens[0][0] === TokenType.PIPE) {
				tokens.shift();
				out.push(['wiki', parser.consumeUntil(tokens, [TokenType.BRACKET_RIGHT]), text]);
			} else {
				out.push(['wiki', text, text]);
			}
			// @ts-ignore
			if (tokens[0][0] !== TokenType.BRACKET_RIGHT || tokens[1][0] !== TokenType.BRACKET_RIGHT) throw new Error('lmao bad');
			tokens.splice(0, 2);
		} else {
			out.push(['text', tokens.shift()![1]]);
		}
	},
	parseLink(tokens: Tokens, out: Parsed) {
		const backup = tokens.slice();

		tokens.shift();
		const text = parser.consumeNonSpecial(tokens);
		if (tokens[0][0] !== TokenType.QUOTE || tokens[1][0] !== TokenType.COLON || tokens[2][0] !== TokenType.TEXT) {
			tokens.splice(0, tokens.length, ...backup);
			out.push(['text', tokens.shift()![1]]);
			return;
		}
		tokens.splice(0, 2);
		out.push(['link', text, parser.consumeUntil(tokens, [TokenType.WHITESPACE])]);
	},
	consumeNonSpecial(tokens: Tokens): string {
		const out: string[] = [];
		while (tokens.length > 0 && (tokens[0][0] === TokenType.TEXT || tokens[0][0] === TokenType.WHITESPACE)) {
			out.push(tokens.shift()![1]);
		}
		return out.join('');
	},
	consumeUntil(tokens: Tokens, until: TokenType[]): string {
		const out: string[] = [];
		while (tokens.length > 0 && !until.includes(tokens[0][0])) {
			out.push(tokens.shift()![1]);
		}
		return out.join('');
	},
};

export default Vue.extend({
	props: {
		text: {
			type: String,
			required: true,
		},
	},
	computed: {
		parsed() {
			// TODO: this wont match nested tags and will break with links. i feel like regex is not a good solution here.
			// Match a BBCode tag or anything until a BBCode tag.
			/* const re = /\[([^\]]+)\]([^\[]+)\[([^\]]+)\]|([^\[]+)/i;
			let chunk;
			const output = [];

			while (chunk = re.exec(this.text)) {
				if (chunk[4]) {
					output.push(['text', chunk[4]]);
				} else if (chunk[1]) {
					output.push(['text', chunk[4]]);
				}
			}

			return output; */
			return parser.parse(this.text);
		},
	},
	render(h) {
		// @ts-ignore
		const parsed = parser.parse(this.text);

		return h('div', parsed.map((entity) => {
			if (entity[0] === 'text') {
				return h('span', entity[1]);
			} else if (entity[0] === 'wiki') {
				return h('a', {
					attrs: {
						href: `https://e621.net/wiki/${entity[2]}`,
					},
				}, entity[1]);
			} else if (entity[0] === 'link') {
				return h('a', {
					attrs: {
						href: entity[2],
					},
				}, entity[1]);
			} else {
				throw new Error(`${entity[0]} type not implemented`);
			}
		}));
	},
});
</script>

<style lang="stylus" scoped>

</style>
