import { E } from 'js-vextensions';
import { BaseComponent } from 'react-vextensions';
import { VReactMarkdown, PageContainer } from 'vwebapp-framework';
import { styles } from '../../Utils/UI/GlobalStyles';

const pageText = `
This instance of Debate Map is outdated and only kept up for reference purposes.

New version: https://debatemap.app
`;

export class HomeUI2 extends BaseComponent<{}, {}> {
	render() {
		return (
			<PageContainer scrollable={true}>
				<article>
					<VReactMarkdown source={pageText} className='selectable'/>
				</article>
			</PageContainer>
		);
	}
}
