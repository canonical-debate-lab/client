import { E } from 'js-vextensions';
import { BaseComponent } from 'react-vextensions';
import {VReactMarkdown} from 'Utils/FrameworkOverrides';
import { styles } from '../../Utils/UI/GlobalStyles';

const pageText = `
Welcome to the Canonical Debate website.

Description text will be added here later.

Note that currently, only mods/admins are able to add/edit content. This will be changed later on.
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
