import React from 'react';
import FieldFeedback from './FieldFeedback';

type Props = {
    id?: string;
    label?: React.ReactNode;
    children: React.ReactNode;
    help?: React.ReactNode;
    error?: string | undefined;
    feedback?: React.ReactNode; // always-render feedback (like HTML validity hints)
    className?: string;
    labelClassName?: string;
    inputWrapperClassName?: string;
    required?: boolean;
};

export const FormField: React.FC<Props> = ({ id, label, children, help, error, feedback, className, labelClassName, inputWrapperClassName, required }) => {
    return (
        <div className={`mb-3 ${className ?? ''}`.trim()}>
            {label && (
                <label htmlFor={id} className={`form-label ${labelClassName ?? ''}`.trim()}>
                    {label}{required ? ' *' : ''}
                </label>
            )}

            <div className={inputWrapperClassName}>{children}</div>

            {help && <div className="form-text">{help}</div>}

            {error ? <FieldFeedback>{error}</FieldFeedback> : (feedback ? <FieldFeedback>{feedback}</FieldFeedback> : null)}
        </div>
    );
};

export default FormField;
