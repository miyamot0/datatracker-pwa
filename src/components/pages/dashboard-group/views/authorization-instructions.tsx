export default function AuthorizationInstructions() {
  return (
    <>
      <p>
        Web-apps need to have <span className="underline">explicit authorization</span> from users to access local
        folders. You must clearly and consistently endorse that you approve that the app do this each time it is loaded.
        You will be asked to authorize access <span className="underline">each time</span> time you re-start the
        program.
      </p>
      <p>
        Depending on your settings, you will have to select a folder named "DataTracker" to proceed. To authorize access
        to this folder, you will need to use the button featured below. Once authorized, you will see a change in the
        authorization status illustrated in the menubar.
      </p>
    </>
  );
}
