import { ToInt, ToNumber } from 'js-vextensions';
import { TextInput, TextInputProps } from 'react-vcomponents';
import { BaseComponent } from 'react-vextensions';
import { Omit } from 'Utils/FrameworkOverrides';

export class MinuteSecondInput extends BaseComponent<{value: number, onChange: (totalSeconds: number, minutes: number, seconds: number)=>any} & Omit<React.PropsWithoutRef<TextInputProps>, 'value'>, {}> {
	render() {
		const { value, onChange, ...rest } = this.props;
		return (
			<TextInput {...rest} delayChangeTillDefocus={true}
				value={value == null ? null : `${ToInt(value / 60)}:${value % 60}`}
				onChange={(timeStr) => {
					const parts = timeStr.split(':');
					if (parts.length != 2) return;
					const minutes = ToNumber(parts[0]);
					const seconds = ToNumber(parts[1]);
					const totalSeconds = (minutes * 60) + seconds;
					onChange(totalSeconds, minutes, seconds);
				}}/>
		);
	}
}
