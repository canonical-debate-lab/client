import { E } from "js-vextensions";
import { BaseComponent, GetInnerComp } from "react-vextensions";
import { demoMap, demoRootNodeID } from "UI/Home/DemoMap";
import { Connect } from "../../Frame/Database/FirebaseConnect";
import VReactMarkdown from "../../Frame/ReactComponents/VReactMarkdown";
import { styles } from "../../Frame/UI/GlobalStyles";
import { GetNodeL3 } from "../../Store/firebase/nodes/$node";
import { MapNodeL3 } from "../../Store/firebase/nodes/@MapNode";
import { MapUI } from "../@Shared/Maps/MapUI";

let red = `rgba(255,0,0,.7)`;
let green = `rgba(0,255,0,.6)`;
let pageText = `
Welcome to the Canonical Debate website.

Description text will be added here later.
`;

let info = {text: pageText};

type Props = {} & Partial<{demoRootNode: MapNodeL3}>;
@Connect(state=> ({
	demoRootNode: GetNodeL3(demoRootNodeID+""),
}))
export default class HomeUI2 extends BaseComponent<Props, {}> {
	/*static contextTypes = {
		router: PropTypes.shape({
			history: PropTypes.shape({
				push: PropTypes.func.isRequired,
				replace: PropTypes.func.isRequired,
				createHref: PropTypes.func.isRequired
			}).isRequired
		}).isRequired
	};*/
	//static contextTypes = {router: ()=>{}};
	render() {
		let {demoRootNode} = this.props;
		/*if (demoRootNode_override) // for dev
			demoRootNode = demoRootNode_override;*/
		//let {router} = this.context;
		
		return (
			<article>
				<VReactMarkdown source={pageText.split("$mapPlaceholder")[0]} className="selectable" style={E(styles.page, {marginBottom: 0})}/>
				<GlobalMapPlaceholder demoRootNode={demoRootNode} style={{}}/>
				<VReactMarkdown source={pageText.split("$mapPlaceholder")[1]} className="selectable" style={E(styles.page, {marginTop: 0})}/>
			</article>
		);
	}
}

class GlobalMapPlaceholder extends BaseComponent<{demoRootNode: MapNodeL3, style}, {}> {
	root: HTMLDivElement;
	mapUI: MapUI;
	render() {
		let {demoRootNode, style} = this.props;
		if (isBot) return <div/>;

		return (
			<div ref={c=>this.root = c} style={{
				//margin: `0 -50px`,
				/*height: 500,*/ userSelect: "none", position: "relative",
				/*borderTop: "5px solid rgba(255,255,255,.3)",
				borderBottom: "5px solid rgba(255,255,255,.3)",*/
			}}>
				<style>{`
				/* since it has less padding to avoid drag-from-unselect-area-to-select-area situation, just disable selection completely */
				.DemoMap * { user-select: none; }

				.DemoMap.draggable > .content { cursor: default !important; /*pointer-events: none;*/ }
				:not(.below) > .in { display: none; }
				.below > .below { display: none; }
				.below .content { pointer-events: none; }
				.DemoMap.draggable .MapUI { pointer-events: initial; cursor: grab; cursor: -webkit-grab; cursor: -moz-grab; }
				.DemoMap.draggable.scrollActive .MapUI { cursor: grabbing !important; cursor: -webkit-grabbing !important; cursor: -moz-grabbing !important; }

				.DemoMap > .scrollTrack { display: none; }
				`}</style>
				
				<MapUI ref={c=>this.mapUI = c ? GetInnerComp(c) as any : null} className="DemoMap"
					map={demoMap} rootNode={demoRootNode} withinPage={true}
					//padding={{left: 200, right: 500, top: 100, bottom: 100}}
					padding={{left: (screen.availWidth / 2) - 300, right: screen.availWidth, top: 100, bottom: 100}}
				/>
				<div className="in" style={{position: "absolute", left: 0, right: 0, top: 0, bottom: 0}}
					onMouseEnter={()=>$(this.root).removeClass("below")} onTouchStart={()=>$(this.root).removeClass("below")}/>
				<div className="below" style={{position: "absolute", left: 0, right: 0, top: "100%", height: 300}}
					onMouseEnter={()=>$(this.root).addClass("below")} onTouchStart={()=>$(this.root).addClass("below")}/>
			</div>
		);
	}
}