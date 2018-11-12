import { Connect } from 'Frame/Database/FirebaseConnect';
import { CopyText } from 'Frame/General/Others';
import { GetNewURL } from 'Frame/URL/URLManager';
import { VURL, WaitXThenRun } from 'js-vextensions';
import { Button, Column, DropDown, DropDownContent, DropDownTrigger, Pre, Row, RowLR, Select, TextInput } from 'react-vcomponents';
import { BaseComponent } from 'react-vextensions';
import { GetCurrentURL } from '../../../../../Frame/General/URLs';
import { Map } from '../../../../../Store/firebase/maps/@Map';
import { GetMapTimelines } from '../../../../../Store/firebase/timelines';
import { Timeline } from '../../../../../Store/firebase/timelines/@Timeline';

type ShareDropDownProps = {map: Map} & Partial<{newURL: VURL, timelines: Timeline[]}>;
@Connect((state, {map}: ShareDropDownProps)=> ({
	newURL: GetNewURL(),
	timelines: GetMapTimelines(map),
	}))
export class ShareDropDown extends BaseComponent<ShareDropDownProps, {timeline: Timeline, justCopied: boolean}> {
	render() {
		const { map, newURL, timelines } = this.props;
		const { timeline, justCopied } = this.state;

		newURL.queryVars.Clear();
		newURL.domain = GetCurrentURL(true).domain;
		if (timeline) {
			newURL.SetQueryVar('timeline', timeline._id);
		}

		const splitAt = 130;
		return (
			<DropDown>
				<DropDownTrigger><Button mr={5} text="Share"/></DropDownTrigger>
				<DropDownContent style={{ right: 0, width: 400 }}>
					<Column>
						<RowLR splitAt={splitAt}>
							<Pre>URL: </Pre>
							<Row style={{ width: '100%' }}>
								<TextInput value={newURL.toString({ domain: true })} readOnly={true} style={{ flex: 0.75 }}/>
								<Button text={justCopied ? 'Copied!' : 'Copy'} ml={5} style={{ flex: '.25 0 auto' }} onClick={() => {
									CopyText(newURL.toString({ domain: true }));
									this.SetState({ justCopied: true });
									WaitXThenRun(1000, () => this.SetState({ justCopied: false }));
								}}/>
							</Row>
						</RowLR>
						<RowLR mt={5} splitAt={splitAt}>
							<Pre>Show timeline: </Pre>
							<Select options={[{ name: 'None', value: null } as any].concat(timelines)} value={timeline} onChange={val => this.SetState({ timeline: val })}/>
						</RowLR>
					</Column>
				</DropDownContent>
			</DropDown>
		);
	}
}