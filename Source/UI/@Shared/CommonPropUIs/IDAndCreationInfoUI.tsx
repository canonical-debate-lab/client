import Moment from 'moment';
import { Column, Pre, Row } from 'react-vcomponents';
import { BaseComponent } from 'react-vextensions';
import { ACTSetPage, ACTSetSubpage } from 'Store/main';
import { ACTUserSelect } from 'Store/main/database';
import { Link } from 'Utils/FrameworkOverrides';
import { User } from 'Store/firebase/users/@User';

export class IDAndCreationInfoUI extends BaseComponent<{id: string | number, creator: User, createdAt: number}, {}> {
	render() {
		const { id, creator, createdAt } = this.props;
		return (
			<Column sel>
				<Row>ID: {id}</Row>
				<Row>
					<Pre>Created at: {Moment(createdAt).format('YYYY-MM-DD HH:mm:ss')} (by: </Pre>
					<Link text={creator == null ? 'n/a' : creator.displayName}
						actions={creator == null ? [] : [new ACTSetPage('database'), new ACTSetSubpage({ page: 'database', subpage: 'users' }), new ACTUserSelect({ id: creator._key })]} />
					<Pre>)</Pre>
				</Row>
			</Column>
		);
	}
}
