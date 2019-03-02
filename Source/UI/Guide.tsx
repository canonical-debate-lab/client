import { BaseComponent } from 'react-vextensions';
import {Div} from "react-vcomponents";
import {styles} from "../Utils/UI/GlobalStyles";

export class GuideUI extends BaseComponent<{}, {}> {
	render() {
		return (
			<Div style={styles.page}>
				Guide page is under development.
			</Div>
		);
	}
}
