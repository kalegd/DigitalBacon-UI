const Handedness = {
    LEFT: "LEFT",
    RIGHT: "RIGHT",
};

Handedness.otherHand = (hand) => {
    if(hand == Handedness.LEFT) return Handedness.RIGHT;
    if(hand == Handedness.RIGHT) return Handedness.LEFT;
    console.error('ERROR: Unexpected hand provided to Handedness.otherHand');
};

export default Handedness;
