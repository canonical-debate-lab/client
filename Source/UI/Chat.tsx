import { BaseComponent } from 'react-vextensions';
import {Div} from "react-vcomponents";
import {styles} from "../Utils/UI/GlobalStyles";

export class ChatUI extends BaseComponent<{}, {}> {
	render() {
		return (
			<Div style={styles.page}>
				Chat page is under development.
			</Div>
		);
	}
}
