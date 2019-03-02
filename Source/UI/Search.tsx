import { BaseComponent } from 'react-vextensions';
import {Div} from "react-vcomponents";
import {styles} from "../Utils/UI/GlobalStyles";

export class SearchUI extends BaseComponent<{}, {}> {
	render() {
		return (
			<Div style={styles.page}>
				Search page is under development.
			</Div>
		);
	}
}
