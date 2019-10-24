import { MeID } from 'Store/firebase/users';
import { ShowSignInPopup } from 'UI/@Shared/NavBar/UserPanel';
import { Button } from 'react-vcomponents';
import { BaseComponent, GetDOM } from 'react-vextensions';
import { CanGetBasicPermissions } from 'Store/firebase/userExtras';
import { ForNewLink_GetError, GetParentNodeID, GetParentNodeL3, GetHolderType } from 'Store/firebase/nodes';
import { LinkNode_HighLevel, LinkNode_HighLevel_GetCommandError } from 'Server/Commands/LinkNode_HighLevel';
import { ACTSetLastAcknowledgementTime } from 'Store/main';
import { ShowMessageBox } from 'react-vmessagebox';
import { GetNodeDisplayText } from 'Store/firebase/nodes/$node';
import { GADDemo } from 'UI/@GAD/GAD';
import { HSLA } from 'Utils/FrameworkOverrides';
import { Map } from '../../../../../Store/firebase/maps/@Map';
import { MapNodeL3, Polarity, ClaimForm } from '../../../../../Store/firebase/nodes/@MapNode';
import { GetNodeColor, MapNodeType } from '../../../../../Store/firebase/nodes/@MapNodeType';
import { ShowAddChildDialog } from '../NodeUI_Menu/AddChildDialog';

type Props = {map: Map, node: MapNodeL3, path: string, polarity: Polarity, style?};
/* const dropTargetDecorator = DropTarget('node',
	{
		canDrop(props: Props, monitor) {
			const { map, node: draggedNode, path: draggedNodePath } = monitor.getItem();
			const { node: dropOnNode, path: dropOnNodePath, polarity } = props;
			// if (!monitor.isOver({shallow: true})) return false;

			if (dropOnNode === draggedNode) return false; // if we`re dragging item onto itself, reject

			const linkCommand = CreateLinkCommand(map, draggedNode, draggedNodePath, dropOnNode, dropOnNodePath, polarity);
			const error = LinkNode_HighLevel_GetCommandError(linkCommand);
			if (error) return false;

			return true;
		},
		drop(props: Props, monitor, dropTarget: any) {
			if (monitor.didDrop()) return;

			const { map, node: draggedNode, path: draggedNodePath } = monitor.getItem();
			const { node: dropOnNode, path: dropOnNodePath, polarity } = props;

			const linkCommand = CreateLinkCommand(map, draggedNode, draggedNodePath, dropOnNode, dropOnNodePath, polarity);
			const error = LinkNode_HighLevel_GetCommandError(linkCommand);
			if (error) return;

			ShowMessageBox({
				title: `${ctrlDown ? 'Copy' : 'Move'} node as new argument?`, cancelButton: true,
				message: `
					Are you sure you want to ${ctrlDown ? 'copy' : 'move'} the dragged node as a new argument?

					Destination (new parent): ${GetNodeDisplayText(dropOnNode)}
					Dragged claim/argument: ${GetNodeDisplayText(draggedNode)}
				`.AsMultiline(0),
				onOK: async () => {
					const { argumentWrapperID } = await linkCommand.Run();
					if (argumentWrapperID) {
						store.dispatch(new ACTSetLastAcknowledgementTime({ nodeID: argumentWrapperID, time: Date.now() }));
					}
				},
			});
		},
	},
	(connect, monitor) => ({
		connectDropTarget: connect.dropTarget(),
		canDrop: monitor.canDrop(),
		isOver: monitor.isOver(), // ({shallow: true}),
		draggedItem: monitor.getItem(),
	})); */
export class AddArgumentButton extends BaseComponent<Props, {}> {
	render() {
		const { map, node, path, polarity, style } = this.props;
		const backgroundColor = GetNodeColor({ type: MapNodeType.Argument, finalPolarity: polarity } as MapNodeL3);

		return (
			<Button
				text={`Add ${polarity == Polarity.Supporting ? 'pro' : 'con'}`} title={`Add ${Polarity[polarity].toLowerCase()} argument`}
				enabled={CanGetBasicPermissions(MeID())}
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
					// canDrop && { outline: `1px solid ${isOver ? 'yellow' : 'white'}` },
					GADDemo && { color: HSLA(222, 0.1, 0.8, 1), fontFamily: 'TypoPRO Bebas Neue', fontSize: 13, letterSpacing: 1 },
					style,
				)}
				onClick={(e) => {
					if (e.button != 0) return;
					if (MeID() == null) return ShowSignInPopup();

					ShowAddChildDialog(path, MapNodeType.Argument, polarity, MeID(), map._key);
				}}/>
		);
	}
}
