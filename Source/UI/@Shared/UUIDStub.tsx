import { BaseComponent } from 'react-vextensions';
import { Text, Row } from 'react-vcomponents';

export class UUIDStub extends BaseComponent<{id: string}, {}> {
	render() {
		const { id } = this.props;
		const id_start = id.slice(0, 4);
		const id_end = id.slice(4);
		return (
			<Row title={id}>
				<Text>{id_start}</Text>
				<Text style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>{id_end}</Text>
				<Text style={{ fontSize: 1, width: 0, opacity: 0 }}> </Text>
			</Row>
		);
	}
}
