interface StandardButton {
    type: string,
    title: string,
    payload: string
}

interface QuickReplyButton {
    content_type: string, 
    title: string, 
    payload: string,
    image_url?: string
}