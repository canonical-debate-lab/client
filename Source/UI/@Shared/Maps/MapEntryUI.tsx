import { VURL } from 'js-vextensions';
import Moment from 'moment';
import { Column, Div, Row } from 'react-vcomponents';
import { BaseComponentWithConnector, BaseComponentPlus } from 'react-vextensions';
import { columnWidths } from 'UI/Debates';
import { Connect, Link, HSLA, Watch } from 'Utils/FrameworkOverrides';
import { GADDemo } from 'UI/@GAD/GAD';
import { Map, MapType } from '../../../Store_Old/firebase/maps/@Map';
import { GetUser } from '../../../Store_Old/firebase/users';
import { ACTDebateMapSelect } from '../../../Store_Old/main/debates';
import { ACTPersonalMapSelect } from '../../../Store_Old/main/personal';

export class MapEntryUI extends BaseComponentPlus({} as {index: number, last: boolean, map: Map}, {}) {
	render() {
		const { index, last, map } = this.props;
		const creator = Watch(() => map && GetUser(map.creator), [map]);

		const toURL = new VURL(null, [map.type == MapType.Personal ? 'personal' : 'debates', `${map._key}`]);
		return (
			<Column p="7px 10px" style={E(
				{ background: index % 2 == 0 ? 'rgba(30,30,30,.7)' : 'rgba(0,0,0,.7)' },
				GADDemo && {
					background: index % 2 == 0 ? 'rgba(255,255,255,1)' : 'rgba(222,222,222,1)', color: HSLA(222, 0.33, 0.5, 0.8),
					fontFamily: "'Cinzel', serif", fontVariant: 'small-caps', fontSize: 17, fontWeight: 'bold',
				},
				last && { borderRadius: '0 0 10px 10px' },
			)}>
				<Row>
					{/* <Link text={map.name} actions={d=>d(new ACTDebateMapSelect({id: map._id}))} style={{fontSize: 17, flex: columnWidths[0]}}/> */}
					{/* <Column style={{flex: columnWidths[0]}}>
						<Link text={map.name} to={toURL.toString({domain: false})} style={{fontSize: 17}} onClick={e=> {
							e.preventDefault();
							store.dispatch(new (map.type == MapType.Personal ? ACTPersonalMapSelect : ACTDebateMapSelect)({id: map._id}));
						}}/>
						<Row style={{fontSize: 13}}>{map.note}</Row>
					</Column> */}
					<Div style={{ position: 'relative', flex: columnWidths[0] }}>
						<Link text={map.name} to={toURL.toString({ domain: false })} style={E({ fontSize: 17 }, GADDemo && { color: HSLA(222, 0.33, 0.5, 0.8) })} onClick={(e) => {
							e.preventDefault();
							store.dispatch(new (map.type == MapType.Personal ? ACTPersonalMapSelect : ACTDebateMapSelect)({ id: map._key }));
						}}/>
						{map.note &&
							<Div style={E(
								{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginRight: 10, marginTop: 4 },
								map.noteInline && { marginLeft: 15, float: 'right' },
							)}>
								{map.note}
							</Div>}
					</Div>
					{!GADDemo && <span style={{ flex: columnWidths[1] }}>{map.edits || 0}</span>}
					<span style={{ flex: columnWidths[2] }}>{Moment(map.editedAt).format('YYYY-MM-DD')}</span>
					<span style={{ flex: columnWidths[3] }}>{creator ? creator.displayName : '...'}</span>
				</Row>
			</Column>
		);
	}
}
