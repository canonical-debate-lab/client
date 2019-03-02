import { BaseComponent, SimpleShouldUpdate } from 'react-vextensions';
import {VReactMarkdown_Remarkable} from 'Utils/FrameworkOverrides';
import { styles } from '../../Utils/UI/GlobalStyles';

const pageText = `
### Social media

* Blog: [https://medium.com/canonical-debate-lab](https://medium.com/canonical-debate-lab)
* Facebook: [https://www.facebook.com/CanonicalDebateLab](https://www.facebook.com/CanonicalDebateLab)
* Twitter: [https://twitter.com/CanonicalDebate](https://twitter.com/CanonicalDebate)

### Development

* Slack (project chat): [Invite link](https://join.slack.com/t/canonicaldebatelab/shared_invite/enQtMzEzOTU3NzYyMDY3LTI4YzUxM2I0MjFjZDNlMzQxZDM4YTgwNDNlMTY3YWQwNjJhYjk0ODE1MGU5NzQ2MTAyNTFhZWRhMGNjMjAxNmE)
* Github (source code): [https://github.com/canonical-debate-lab/client](https://github.com/canonical-debate-lab/client)
`;

@SimpleShouldUpdate
export class LinksUI extends BaseComponent<{}, {}> {
	render() {
		const { page, match } = this.props;
		return (
			<article className="selectableAC" style={styles.page}>
				{/* <VReactMarkdown className="selectable" source={pageText} containerProps={{style: styles.page}}/> */}
				<VReactMarkdown_Remarkable source={pageText}/>
			</article>
		);
	}
}
