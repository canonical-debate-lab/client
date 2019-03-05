import { ScrollView } from 'react-vscrollview';
import { BaseComponent } from 'react-vextensions';
import { VReactMarkdown_Remarkable } from 'Utils/FrameworkOverrides';
import { styles, ES } from '../Utils/UI/GlobalStyles';

const pageText = `
The Social page is under development.

In the meantime, here are links to our social media and development pages:
`;

export class SocialUI extends BaseComponent<{}, {}> {
	render() {
		return (
			<ScrollView style={ES({ flex: 1 })} scrollVBarStyle={{ width: 10 }}>
				<article className="selectableAC" style={styles.page}>
					{/* <VReactMarkdown className="selectable" source={pageText} containerProps={{style: styles.page}}/> */}
					<VReactMarkdown_Remarkable source={pageText}/>
				</article>
			</ScrollView>
		);
	}
}
