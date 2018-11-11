import { GetUserID } from 'Store/firebase/users';
import { ShowSignInPopup } from 'UI/@Shared/NavBar/UserPanel';
import { Button } from 'react-vcomponents';
import { BaseComponent } from 'react-vextensions';
import { DropTarget } from 'react-dnd';
import { Map } from '../../../../../Store/firebase/maps/@Map';
import { MapNodeL3, Polarity } from '../../../../../Store/firebase/nodes/@MapNode';
import { GetNodeColor, MapNodeType } from '../../../../../Store/firebase/nodes/@MapNodeType';
import { ShowAddChildDialog } from '../NodeUI_Menu/AddChildDialog';

type Props = {map: Map, node: MapNodeL3, path: string, polarity: Polarity, style?};
const dropTargetDecorator = DropTarget('node',
	{
		canDrop(props: Props, monitor) {
			const draggedNode = monitor.getItem().event;
			const { node: dropOnNode } = props;
			// if (!monitor.isOver({shallow: true})) return false;

			if (dropOnNode === draggedNode) return false; // if we're dragging item onto itself, reject
			return true;
		},
		drop(props: Props, monitor, dropTarget: any) {
			if (monitor.didDrop()) return;

			const draggedItem = monitor.getItem();
			const { node } = props;


		},
	},
	(connect, monitor) => ({
		connectDropTarget: connect.dropTarget(),
		isOver: monitor.isOver(), // ({shallow: true}),
		draggedItem: monitor.getItem(),
	}));
@(dropTargetDecorator as any)
export class AddArgumentButton extends BaseComponent<Props, {}> {
	render() {
		const { map, node, path, polarity, style } = this.props;
		const backgroundColor = GetNodeColor({ type: MapNodeType.Argument, finalPolarity: polarity } as MapNodeL3);

		return (
			<Button text={`Add ${polarity == Polarity.Supporting ? 'pro' : 'con'}`} title={`Add ${Polarity[polarity].toLowerCase()} argument`}
				// text={`Add ${Polarity[polarity].toLowerCase()} argument`}
				style={E(
					{
						alignSelf: 'flex-end', backgroundColor: backgroundColor.css(),
						border: 'none', boxShadow: 'rgba(0,0,0,1) 0px 0px 2px',
						// width: 150, padding: "2px 12px",
						width: 60, padding: '2px 12px',
						':hover': { backgroundColor: backgroundColor.Mix('white', 0.05).alpha(0.9).css() },
					},
					/* polarity == Polarity.Supporting && {marginBottom: 5},
					polarity == Polarity.Opposing && {marginTop: 5}, */
					{ height: 17, fontSize: 11, padding: '0 12px' }, // vertical
					// {fontSize: 18, padding: "0 12px"}, // horizontal
					style,
				)}
				onClick={(e) => {
					if (e.button != 0) return;
					if (GetUserID() == null) return ShowSignInPopup();

					ShowAddChildDialog(node, path, MapNodeType.Argument, polarity, GetUserID(), map._id);
				}}/>
		);
	}
}
