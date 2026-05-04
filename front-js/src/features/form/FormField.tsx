import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface FormFieldProps {
	label: string;
	type: string;
	name: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	required?: boolean;
}

export default function FormField({
	label,
	type,
	name,
	value,
	onChange,
	placeholder,
	required,
}: FormFieldProps) {
	const [showPassword, setShowPassword] = useState(false);
	const isPassword = type === 'password';
	const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

	return (
		<div className="flex flex-col gap-1">
			<label className="label-field">{label}</label>
			<div className="relative">
				<input
					type={inputType}
					name={name}
					value={value}
					onChange={onChange}
					placeholder={placeholder}
					className={`input-field${isPassword ? ' pr-10' : ''}`}
					required={required}
				/>
				{isPassword && (
					<button
						type="button"
						onClick={() => setShowPassword(v => !v)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
						tabIndex={-1}
						aria-label={showPassword ? 'Masquer le mot de passe' : 'Voir le mot de passe'}
					>
						{showPassword
							? <EyeOff className="h-4 w-4" />
							: <Eye className="h-4 w-4" />}
					</button>
				)}
			</div>
		</div>
	);
}
