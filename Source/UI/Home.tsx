import { BaseComponent } from 'Utils/UI/BaseComponent';

export class HomeUI extends BaseComponent<{}, {}> {
	render() {
		let {} = this.props;
		return (
			<div>
				Hello world!
			</div>
		);
	}
}