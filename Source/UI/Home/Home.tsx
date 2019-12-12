import { E } from 'js-vextensions';
import { BaseComponent } from 'react-vextensions';
import { VReactMarkdown, PageContainer } from 'vwebapp-framework';
import { styles } from '../../Utils/UI/GlobalStyles';

const pageText = `
Welcome to the Canonical Debate website.

Description text will be added here later.
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
