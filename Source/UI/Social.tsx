import {BaseComponent} from "react-vextensions";
import {styles} from "../Frame/UI/GlobalStyles";
import VReactMarkdown_Remarkable from "../Frame/ReactComponents/VReactMarkdown_Remarkable";
import {ScrollView} from "react-vscrollview";

let pageText = `
The Social page is under development.

In the meantime, here are links to our social media and development pages:
`;

export default class SocialUI extends BaseComponent<{}, {}> {
	render() {
		return (
			<ScrollView style={ES({flex: 1})} scrollVBarStyle={{width: 10}}>
				<article className="selectableAC" style={styles.page}>
					{/*<VReactMarkdown className="selectable" source={pageText} containerProps={{style: styles.page}}/>*/}
					<VReactMarkdown_Remarkable source={pageText}/>
				</article>
			</ScrollView>
		);
	}
}