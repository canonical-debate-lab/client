import { BaseComponent } from 'react-vextensions';
import {Div} from "react-vcomponents";
import {styles} from "../Utils/UI/GlobalStyles";

export class StreamUI extends BaseComponent<{}, {}> {
	render() {
		return (
			<Div style={styles.page}>
				Stream page is under development.
			</Div>
		);
	}
}
