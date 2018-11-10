import { E } from 'js-vextensions';
import { BaseComponent } from 'react-vextensions';
import VReactMarkdown from '../../Frame/ReactComponents/VReactMarkdown';
import { styles } from '../../Frame/UI/GlobalStyles';

const pageText = `
Welcome to the Canonical Debate website.

Description text will be added here later.
`;

export class HomeUI2 extends BaseComponent<{}, {}> {
	render() {
		return (
			<article>
				<VReactMarkdown source={pageText} className='selectable' style={E(styles.page, { marginBottom: 0 })}/>
			</article>
		);
	}
}
