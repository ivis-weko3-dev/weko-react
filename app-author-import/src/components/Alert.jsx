import { Alert } from 'react-bootstrap';

export const AlertDismissible = ({ type = 'danger', msg = '', onClose }) => {
    if (msg !== '') {
        return (
            <Alert variant={type} onClose={onClose} className="opacity1" dismissible>
                <div dangerouslySetInnerHTML={{ __html: msg }} />
            </Alert>
        );
    }
    return '';
}
