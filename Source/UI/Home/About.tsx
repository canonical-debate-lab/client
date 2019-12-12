import { BaseComponent, SimpleShouldUpdate } from 'react-vextensions';
import { VReactMarkdown, PageContainer } from 'vwebapp-framework';
import { styles } from '../../Utils/UI/GlobalStyles';

const pageText = `
A proposal to fix the current state of online discourse through the promotion of fact-based reasoning,
	and the accumulation of human knowledge, brought to you by the Canonical Debate Lab, a community project of the Democracy Earth Foundation.

We waste so much time repeating old arguments and running in opposite directions. The internet looked like it would ease the problem
	by giving us access to vast knowledge and each of us a voice. It seems to have made the situation worse by overwhelming us with
	disorganized, contradictory information. Social media amplifies bias and creates echo chambers.
The Canonical Debate Lab is building a resource to gather and organize all information for all sides of contentious issues so everyone
	can make better decisions with less effort. This tool reverses many of the natural incentives of social networks that have led to
	information bubbles, clickbait headlines, sensationalist journalism, and "fake news."
We believe that with this tool, we can finally fulfill the promise that was given with the rise of the Internet.
`;

@SimpleShouldUpdate
export class AboutUI extends BaseComponent<{}, {}> {
	render() {
		const { page, match } = this.props;
		return (
			<PageContainer scrollable={true}>
				<article>
					<VReactMarkdown className="selectable" source={pageText}
						/* markdownOptions={{breaks: false}} rendererOptions={{breaks: false}}
						rendererOptions={{
							components: {
								br: ()=><span> </span>
							}
						}} */
						/* renderers={{
							Text: props=> {
								return <span style={{color: "rgba(255,255,255,.7)"}}>{props.literal}</span>;
							}
						}} */
					/>
				</article>
			</PageContainer>
		);
	}
}
