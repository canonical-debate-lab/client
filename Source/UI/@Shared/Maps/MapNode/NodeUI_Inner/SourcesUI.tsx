import { BaseComponent } from 'react-vextensions';
import { SourceChain, Source } from 'Store/firebase/contentNodes/@SourceChain';
import { Row, Text , Column } from 'react-vcomponents';

import { VURL } from 'js-vextensions';
import { Link } from 'vwebapp-framework';

export class SourcesUI extends BaseComponent<{sourceChains: SourceChain[]}, {}> {
	render() {
		const { sourceChains } = this.props;
		return (
			<Column mt={3} style={{ whiteSpace: 'normal' }}>
				{sourceChains.Any((chain) => chain.sources.Any((source: Source) => source.link && source.link.startsWith('https://biblia.com/bible/nkjv/'))) &&
					<Row style={{ marginBottom: 3, opacity: 0.5, fontSize: 10 }}>
						Scripture taken from the NKJV®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.
					</Row>}
				<Row style={{ color: 'rgba(255,255,255,.5)' }}>Sources:</Row>
				{sourceChains.map((chain: SourceChain, index) => {
					const linkTitle = chain.sources.map((source, index) => {
						if (source.link) {
							// if this is the first source, it's the most important, so show the link's whole url
							if (index == 0) {
								return VURL.Parse(source.link, false).toString({ domain_protocol: false });
							}
							// else, show just the domain-name
							const urlMatch = source.link.match(/https?:\/\/(?:www\.)?([^/]+)/);
							if (urlMatch == null) return source.link; // temp, while updating data
							return urlMatch[1];
						}
						return (source.name || '') + (source.author ? ` (${source.author})` : '');
					}).join(' <- ');

					const { link } = chain.sources.Last();
					return (
						<Row key={index}>
							{link &&
							<Link text={linkTitle} to={link} style={{ wordBreak: 'break-word' }} onContextMenu={(e) => e.nativeEvent['passThrough'] = true}/>}
							{!link &&
							<Text style={{ wordBreak: 'break-word' }}>{linkTitle}</Text>}
						</Row>
					);
				})}
			</Column>
		);
	}
}
