const createCustomer = async (req, res, next) => {

    if (!req.body || !req.body.customer || !req.body.customer_contact) {
        let action = "All fields are required";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    // create customer object for validation and store in database
    let customerObj = {};

    customerObj.customer_name = req.body.customer.customer_name;
    customerObj.customer_code = req.body.customer.customer_code;
    customerObj.address1 = req.body.customer.address1;
    customerObj.address2 = req.body.customer.address2;
    customerObj.address3 = req.body.customer.address3;
    customerObj.city = req.body.customer.city;
    customerObj.state = req.body.customer.state;
    customerObj.country = req.body.customer.country;
    customerObj.pincode = req.body.customer.pincode;
    customerObj.gst_number = req.body.customer.gst_number;

    // *** Customer Parent Data Validation
    const validCustomer = customerSchema(customerObj);
    // return res.json({ validCustomer });

    if (!validCustomer) {
        let action = "Please fill the required customer fields !!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    // create customer-contact object for validation and store in database
    let customerContactObj = {};

    customerContactObj.contact_title = req.body.customer_contact.contact_title;
    customerContactObj.contact_fullname = req.body.customer_contact.contact_fullname;
    customerContactObj.contact_email = req.body.customer_contact.contact_email;
    customerContactObj.contact_phone_1 = req.body.customer_contact.contact_phone_1;
    customerContactObj.contact_phone_2 = req.body.customer_contact.contact_phone_2;

    // *** Customer Contact Data Validation
    const validCustomerContact = customerContactSchema(customerContactObj);
    // return res.json({ validCustomerContact });

    if (!validCustomerContact) {
        let action = "Please fill the required customer contact fields !!!";
        const error = new Error(action);
        error.code = 500;
        return errorHandler(error, req, res, next);
    }

    let customer_id;
    let customerResult;
    let customerContactResult;

    // Fetch the loggedin admin
    const fetchCreater = await User.findOne({
        where: { id: req.userId }
    });

    // Create Customer
    try {
        const findCompany = await customer.findOne({
            where: { customer_name: customerObj.customer_name }
        });

        if (findCompany) {
            let action = "Customer Already exist";
            const error = new Error(action);
            error.code = 500;
            return errorHandler(error, req, res, next);
        }

        customerObj.created_timestamp = Date.now();
        customerObj.created_by_login_name = fetchCreater.name;
        customerObj.created_by_user_id = req.userId;

        customerObj.updated_timestamp = Date.now();
        customerObj.updated_by_login_name = fetchCreater.name;
        customerObj.updated_by_user_id = req.userId

        customerObj.lab_id = req.body.labId;
        customerObj.rstatus = 1;

        const newCustomer = new customer(customerObj)

        customerResult = await newCustomer.save();
        customer_id = customerResult.customer_id;

    } catch (err) {
        console.log(err);
        let action = "Something went wrong while saving the customer";
        const error = new Error(action);
        error.code = 500;
        error.path = "/api/uom/create";
        return errorHandler(error, req, res, next);
    }

    // *** Create Customer Contact
    try {
        customerContactObj.customer_id = customer_id;

        customerContactObj.created_timestamp = Date.now();
        customerContactObj.created_by_login_name = fetchCreater.name;
        customerContactObj.created_by_user_id = req.userId;

        customerContactObj.updated_timestamp = Date.now();
        customerContactObj.updated_by_login_name = fetchCreater.name;
        customerContactObj.updated_by_user_id = req.userId

        const newCustomerContact = new customer_contact(customerContactObj)

        customerContactResult = await newCustomerContact.save();

    } catch (err) {
        console.log(err);
        let action = "Something went wrong while saving the customer contact";
        const error = new Error(action);
        error.code = 400;
        error.path = "/api/uom/create";
        return errorHandler(error, req, res, next);
    }

    return res.status(201).json({
        msg: "Customer Created Successfully",
        customerResult, customerContactResult,
        code: 201
    });
};